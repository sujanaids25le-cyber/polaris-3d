import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { SeaIcePrediction } from "../types/seaice";

import {
  calculateDataBounds,
  createCoordinateTransformer,
} from "../utils/coordinateTransform";

interface SeaIceLayerProps {
  prediction: SeaIcePrediction;
}

/* =========================================================
   POLARIS — SEA ICE INTELLIGENCE
   =========================================================

   Real prediction values are visualized directly.

   Concentration:
   0.00 → open water
   0.10 → very low ice
   0.30 → low/moderate ice
   0.50 → moderate ice
   0.70 → high ice
   1.00 → dense ice

   Design goals:
   - Never create a giant white sheet
   - Preserve the moving ocean underneath
   - Preserve vessel visibility
   - Preserve route visibility
   - Make concentration differences visible
   - Look like Antarctic sea-ice fields rather than a
     generic tiled heatmap
   ========================================================= */


/* =========================================================
   COLOR MAPPING
   ========================================================= */

function concentrationToColor(
  concentration: number
): THREE.Color {
  const c = THREE.MathUtils.clamp(
    concentration,
    0,
    1
  );

  /*
   * Open / very low concentration.
   * Darker blue so it blends into the ocean.
   */
  if (c < 0.15) {
    return new THREE.Color("#1a5b7c");
  }

  /*
   * Low concentration.
   */
  if (c < 0.30) {
    return new THREE.Color("#347f9d");
  }

  /*
   * Moderate concentration.
   */
  if (c < 0.50) {
    return new THREE.Color("#579db5");
  }

  /*
   * Moderately high concentration.
   */
  if (c < 0.70) {
    return new THREE.Color("#82bdcf");
  }

  /*
   * High concentration.
   *
   * Notice this is NOT pure white.
   */
  if (c < 0.85) {
    return new THREE.Color("#afd8e3");
  }

  /*
   * Dense sea ice.
   */
  return new THREE.Color("#d4eaf0");
}


/* =========================================================
   OPACITY MAPPING
   ========================================================= */

function concentrationToOpacity(
  concentration: number
): number {
  const c = THREE.MathUtils.clamp(
    concentration,
    0,
    1
  );

  /*
   * Almost open water.
   *
   * Completely invisible.
   */
  if (c < 0.10) {
    return 0.0;
  }

  /*
   * Very sparse ice.
   */
  if (c < 0.20) {
    return 0.018;
  }

  /*
   * Low concentration.
   */
  if (c < 0.35) {
    return 0.035;
  }

  /*
   * Moderate concentration.
   */
  if (c < 0.50) {
    return 0.060;
  }

  /*
   * Moderately high concentration.
   */
  if (c < 0.65) {
    return 0.085;
  }

  /*
   * High concentration.
   */
  if (c < 0.80) {
    return 0.115;
  }

  /*
   * Dense ice.
   *
   * Still translucent.
   */
  return 0.145;
}


/* =========================================================
   SEA ICE COMPONENT
   ========================================================= */

export function SeaIceLayer({
  prediction,
}: SeaIceLayerProps) {
  const meshRef =
    useRef<THREE.InstancedMesh>(null);


  /* =======================================================
     BUILD INSTANCED SEA-ICE FIELD
     ======================================================= */

  const { instancedMesh } =
    useMemo(() => {
      const { dataPoints } = prediction;

      /*
       * Safety check.
       */
      if (
        !dataPoints ||
        dataPoints.length === 0
      ) {
        return {
          instancedMesh: null,
        };
      }


      /* ===================================================
         COORDINATE SYSTEM
         =================================================== */

      const bounds =
        calculateDataBounds(
          dataPoints
        );

      const {
        transform,
        gridSpacing,
      } =
        createCoordinateTransformer(
          bounds
        );


      /* ===================================================
         CELL SIZE
         ===================================================

         IMPORTANT:

         The old version used approximately the complete
         grid spacing.

         That visually connected thousands of cells into
         one enormous sheet.

         We intentionally leave gaps between cells.

         The gaps allow the moving ocean to show through.
         =================================================== */

      const cellSize =
        Math.max(
          gridSpacing * 0.72,
          0.05
        );


      /* ===================================================
         GEOMETRY
         =================================================== */

      const geometry =
        new THREE.PlaneGeometry(
          cellSize,
          cellSize,
          1,
          1
        );


      /* ===================================================
         CUSTOM SEA-ICE SHADER
         ===================================================

         We need a shader because each prediction cell has
         its own:

         - RGB color
         - opacity
         - soft edge

         MeshBasicMaterial cannot directly provide the
         independent alpha behaviour we want for every
         instance.
         =================================================== */

      const material =
        new THREE.ShaderMaterial({
          transparent: true,

          depthWrite: false,

          depthTest: true,

          side: THREE.DoubleSide,

          vertexColors: true,

          uniforms: {
            /*
             * Overall layer opacity.
             */
            uOpacity: {
              value: 0.92,
            },

            /*
             * Subtle predictive breathing.
             */
            uPulse: {
              value: 1.0,
            },
          },

          vertexShader: `
            attribute vec3 instanceColor;
            attribute float instanceOpacity;

            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vUv;

            void main() {

              vColor = instanceColor;

              vOpacity =
                instanceOpacity;

              vUv = uv;

              vec4 mvPosition =
                modelViewMatrix *
                instanceMatrix *
                vec4(
                  position,
                  1.0
                );

              gl_Position =
                projectionMatrix *
                mvPosition;
            }
          `,

          fragmentShader: `
            uniform float uOpacity;
            uniform float uPulse;

            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vUv;

            void main() {

              /*
               * Convert UV coordinates from:

                 0 → 1

               * into:

                 -1 → +1
               */
              vec2 centered =
                vUv * 2.0 - 1.0;


              /*
               * Distance from centre.

               * This creates a soft floe-like shape
               * instead of a hard square.
               */
              float distanceFromCenter =
                length(centered);


              /*
               * Soft outer edge.

               * Pixels near the edge gradually disappear.
               */
              float edge =
                1.0 -
                smoothstep(
                  0.62,
                  0.98,
                  distanceFromCenter
                );


              /*
               * Slight directional distortion.

               * This prevents every cell from looking
               * like an identical perfect circle.
               */
              float distortion =
                sin(
                  centered.x * 7.0 +
                  centered.y * 4.0
                ) * 0.035;


              float floeMask =
                clamp(
                  edge + distortion,
                  0.0,
                  1.0
                );


              /*
               * Final alpha.

               * Concentration controls opacity.
               * Floe mask softens the edges.
               * Pulse provides extremely subtle movement.
               */
              float alpha =
                vOpacity *
                uOpacity *
                floeMask *
                uPulse;


              /*
               * Very low concentration cells disappear.
               */
              if (
                alpha < 0.004
              ) {
                discard;
              }


              gl_FragColor =
                vec4(
                  vColor,
                  alpha
                );
            }
          `,
        });


      /* ===================================================
         INSTANCED MESH
         =================================================== */

      const mesh =
        new THREE.InstancedMesh(
          geometry,
          material,
          dataPoints.length
        );


      /* ===================================================
         INSTANCE ARRAYS
         =================================================== */

      const colors =
        new Float32Array(
          dataPoints.length * 3
        );

      const opacities =
        new Float32Array(
          dataPoints.length
        );


      /* ===================================================
         TRANSFORM MATRIX
         =================================================== */

      const matrix =
        new THREE.Matrix4();


      /* ===================================================
         POPULATE CELLS
         =================================================== */

      dataPoints.forEach(
        (
          point,
          index
        ) => {

          /*
           * Convert NSIDC coordinates into the
           * POLARIS 3D world.
           */
          const [
            x,
            y,
            z,
          ] =
            transform(
              point.x,
              point.y
            );


          /*
           * Flat sea-ice surface.

           * Rotate plane from XY into XZ.
           */
          matrix.identity();

          matrix.makeRotationX(
            -Math.PI / 2
          );


          /*
           * Place sea ice just above
           * the ocean surface.
           *
           * This prevents z-fighting.
           */
          matrix.setPosition(
            x,
            y + 0.10,
            z
          );


          mesh.setMatrixAt(
            index,
            matrix
          );


          /* ===============================================
             CONCENTRATION
             =============================================== */

          const concentration =
            THREE.MathUtils.clamp(
              Number(
                point.concentration
              ) || 0,
              0,
              1
            );


          /* ===============================================
             COLOR
             =============================================== */

          const color =
            concentrationToColor(
              concentration
            );


          colors[
            index * 3
          ] = color.r;

          colors[
            index * 3 + 1
          ] = color.g;

          colors[
            index * 3 + 2
          ] = color.b;


          /* ===============================================
             OPACITY
             =============================================== */

          opacities[index] =
            concentrationToOpacity(
              concentration
            );
        }
      );


      /* ===================================================
         INSTANCE COLOR ATTRIBUTE
         =================================================== */

      geometry.setAttribute(
        "instanceColor",
        new THREE.InstancedBufferAttribute(
          colors,
          3
        )
      );


      /* ===================================================
         INSTANCE OPACITY ATTRIBUTE
         =================================================== */

      geometry.setAttribute(
        "instanceOpacity",
        new THREE.InstancedBufferAttribute(
          opacities,
          1
        )
      );


      /* ===================================================
         UPDATE FLAGS
         =================================================== */

      mesh.instanceMatrix.needsUpdate =
        true;


      const colorAttribute =
        geometry.getAttribute(
          "instanceColor"
        );

      if (colorAttribute) {
        colorAttribute.needsUpdate =
          true;
      }


      const opacityAttribute =
        geometry.getAttribute(
          "instanceOpacity"
        );

      if (opacityAttribute) {
        opacityAttribute.needsUpdate =
          true;
      }


      console.log(
        `[POLARIS] Rendered ${dataPoints.length} sea-ice cells`
      );


      return {
        instancedMesh: mesh,
      };

    }, [prediction]);


  /* =======================================================
     SUBTLE PREDICTION ANIMATION
     ======================================================= */

  useFrame(
    (state) => {

      if (
        !meshRef.current
      ) {
        return;
      }


      const material =
        meshRef.current
          .material as THREE.ShaderMaterial;


      if (
        !material.uniforms ||
        !material.uniforms.uPulse
      ) {
        return;
      }


      /*
       * Extremely subtle.

       * This should feel like an active intelligence
       * layer, NOT an animated game texture.
       */
      material.uniforms.uPulse.value =
        0.985 +
        Math.sin(
          state.clock.elapsedTime *
          0.25
        ) *
        0.015;
    }
  );


  /* =======================================================
     EMPTY STATE
     ======================================================= */

  if (
    !instancedMesh
  ) {
    return null;
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <primitive
      ref={meshRef}
      object={instancedMesh}
    />
  );
}