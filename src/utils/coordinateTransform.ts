import type { DataBounds } from '../types/seaice';

export function calculateDataBounds(
  dataPoints: Array<{ x: number; y: number }>
): DataBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of dataPoints) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    spanX: maxX - minX,
    spanY: maxY - minY,
  };
}

export function createCoordinateTransformer(bounds: DataBounds) {
  // Target: fit within ~100 scene units to match existing iceberg/vessel scale
  // Ocean plane is 10,000 x 10,000 units, icebergs range from -65 to +65
  // We want sea-ice to be visible but not overwhelming
  const TARGET_SCENE_SIZE = 100;
  const SCENE_SCALE = TARGET_SCENE_SIZE / Math.max(bounds.spanX, bounds.spanY);

  // Calculate grid spacing in scene units
  // Assuming regular NSIDC grid, derive spacing from first two points
  const gridSpacingMeters = 25000; // NSIDC 25km grid
  const gridSpacingScene = gridSpacingMeters * SCENE_SCALE;

  function epsg3412ToScene(x: number, y: number): [number, number, number] {
    // Center the data around origin
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Normalize to scene space, preserving Antarctic orientation
    const sceneX = (x - centerX) * SCENE_SCALE;
    const sceneZ = -(y - centerY) * SCENE_SCALE; // Negate Y for correct orientation
    const sceneY = 0.15; // Just above ocean surface (ocean is at y=0)

    return [sceneX, sceneY, sceneZ];
  }

  // Calculate scene bounds for validation
  const [minSceneX, , minSceneZ] = epsg3412ToScene(bounds.minX, bounds.minY);
  const [maxSceneX, , maxSceneZ] = epsg3412ToScene(bounds.maxX, bounds.maxY);

  const sceneBounds = {
    minX: Math.min(minSceneX, maxSceneX),
    maxX: Math.max(minSceneX, maxSceneX),
    minZ: Math.min(minSceneZ, maxSceneZ),
    maxZ: Math.max(minSceneZ, maxSceneZ),
    gridSpacing: gridSpacingScene,
  };

  console.log('EPSG:3412 Data Bounds:', bounds);
  console.log('Scene Bounds:', sceneBounds);
  console.log('Grid Spacing (scene units):', gridSpacingScene);

  return {
    transform: epsg3412ToScene,
    sceneBounds,
    gridSpacing: gridSpacingScene,
  };
}
