import {
  Canvas,
  useFrame,
  useLoader,
} from "@react-three/fiber";

import { Html, OrbitControls } from "@react-three/drei";

import { Water } from "three/addons/objects/Water.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

import * as THREE from "three";

import {
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

import { SeaIceLayer } from "./components/SeaIceLayer";

import { loadSeaIcePrediction } from "./utils/dataLoader";

import type { LoadState } from "./types/seaice";

import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { RightPanel } from "./components/RightPanel";
import { StatusBar } from "./components/StatusBar";
import { Timeline } from "./components/Timeline";
import { ContextualPanel } from "./components/ContextualPanel";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ExplanationSection } from "./components/ExplanationSection";

import "./polaris.css";

type ScenarioStep = "NOW" | "+6h" | "+12h" | "+18h" | "+24h";

type SelectedEntity = {
  kind: "Vessel" | "Iceberg";
  id: string;
  name: string;
  detail: string;
} | null;

const scenarioSteps: ScenarioStep[] = ["NOW", "+6h", "+12h", "+18h", "+24h"];

const icebergTrajectoryPoints: [number, number, number][] = [
  [15, 0, -22],
  [16, 0, -28],
  [18, 0, -35],
  [23, 0, -45],
  [31, 0, -57],
];


/* =========================================================
   OCEAN
========================================================= */

function Ocean() {
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://threejs.org/examples/textures/waternormals.jpg"
  );

  waterNormals.wrapS =
    THREE.RepeatWrapping;

  waterNormals.wrapT =
    THREE.RepeatWrapping;

  const water = useMemo(() => {
    const geometry =
      new THREE.PlaneGeometry(
        10000,
        10000
      );

    const waterObject = new Water(
      geometry,
      {
        textureWidth: 1024,
        textureHeight: 1024,

        waterNormals,

        sunDirection:
          new THREE.Vector3(
            0.3,
            1,
            0.2
          ).normalize(),

        sunColor: 0x9fcfff,

        waterColor: 0x07528a,

        distortionScale: 3.3,

        fog: true,
      }
    );

    waterObject.rotation.x =
      -Math.PI / 2;

    return waterObject;
  }, [waterNormals]);

  /*
   * Keep the moving water.
   */
  useFrame((_, delta) => {
    water.material.uniforms.time.value +=
      delta;
  });

  return (
    <primitive object={water} />
  );
}


/* =========================================================
   MOON
========================================================= */

function Moon() {
  return (
    <>
      <mesh
        position={[
          0,
          35,
          -80,
        ]}
      >
        <sphereGeometry
          args={[
            8,
            64,
            64,
          ]}
        />

        <meshBasicMaterial
          color="#dcecff"
        />
      </mesh>

      <pointLight
        position={[
          0,
          35,
          -60,
        ]}
        intensity={180}
        distance={300}
        color="#9ecbff"
      />
    </>
  );
}


/* =========================================================
   STARS
========================================================= */

function Stars() {
  const stars = useMemo(() => {
    const positions: number[] = [];

    for (
      let i = 0;
      i < 700;
      i++
    ) {
      positions.push(
        (Math.random() - 0.5) *
          500,

        Math.random() *
          100 +
          20,

        -Math.random() *
          320 -
          20
      );
    }

    return new Float32Array(
      positions
    );
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            stars,
            3,
          ]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#c8e7ff"
        size={0.65}
        sizeAttenuation
      />
    </points>
  );
}


/* =========================================================
   POLARIS VESSEL
========================================================= */

function Vessel({
  subdued = false,
}: {
  subdued?: boolean;
}) {
  const lightScale =
    subdued ? 0.3 : 1;

  return (
    <group>

      {/* MAIN HULL */}

      <mesh
        position={[
          0,
          0,
          0,
        ]}
      >
        <boxGeometry
          args={[
            9,
            1.8,
            3,
          ]}
        />

        <meshStandardMaterial
          color="#173b5c"
          metalness={0.7}
          roughness={0.28}
        />
      </mesh>


      {/* RED ICEBREAKER HULL */}

      <mesh
        position={[
          0,
          -1.05,
          0,
        ]}
      >
        <boxGeometry
          args={[
            8.5,
            0.7,
            2.8,
          ]}
        />

        <meshStandardMaterial
          color="#8b2635"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>


      {/* WHITE BOW */}

      <mesh
        position={[
          3.9,
          0.45,
          0,
        ]}
      >
        <boxGeometry
          args={[
            1.8,
            1.4,
            2.8,
          ]}
        />

        <meshStandardMaterial
          color="#e8f1f5"
          metalness={0.45}
          roughness={0.3}
        />
      </mesh>


      {/* POINTED BOW */}

      <mesh
        position={[
          5.1,
          0.1,
          0,
        ]}
        rotation={[
          0,
          0,
          Math.PI / 2,
        ]}
      >
        <coneGeometry
          args={[
            1.45,
            2.5,
            4,
          ]}
        />

        <meshStandardMaterial
          color="#dce8ed"
          metalness={0.6}
          roughness={0.28}
        />
      </mesh>


      {/* SUPERSTRUCTURE */}

      <mesh
        position={[
          -0.8,
          1.55,
          0,
        ]}
      >
        <boxGeometry
          args={[
            5.5,
            2.2,
            2.5,
          ]}
        />

        <meshStandardMaterial
          color="#e9f0f4"
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>


      {/* BLUE STRIPE */}

      <mesh
        position={[
          -0.8,
          0.75,
          -1.28,
        ]}
      >
        <boxGeometry
          args={[
            5.6,
            0.35,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#1467a5"
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>


      {/* BRIDGE */}

      <mesh
        position={[
          0.2,
          3.05,
          0,
        ]}
      >
        <boxGeometry
          args={[
            4.2,
            1.5,
            2.3,
          ]}
        />

        <meshStandardMaterial
          color="#f3f6f7"
          metalness={0.35}
          roughness={0.3}
        />
      </mesh>


      {/* BRIDGE WINDOWS */}

      <mesh
        position={[
          0.2,
          3.25,
          -1.18,
        ]}
      >
        <boxGeometry
          args={[
            3.5,
            0.65,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#172b3b"
          emissive="#0b6fa8"
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>


      {/* SIDE WINDOWS */}

      <mesh
        position={[
          -1.9,
          3.25,
          0,
        ]}
      >
        <boxGeometry
          args={[
            0.08,
            0.65,
            1.6,
          ]}
        />

        <meshStandardMaterial
          color="#172b3b"
          emissive="#0b6fa8"
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>


      {/* RADAR TOWER */}

      <mesh
        position={[
          0.2,
          4.5,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.12,
            0.12,
            2.2,
            16,
          ]}
        />

        <meshStandardMaterial
          color="#b8c5ce"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* RADAR DOME */}

      <mesh
        position={[
          0.2,
          5.65,
          0,
        ]}
      >
        <sphereGeometry
          args={[
            0.5,
            32,
            16,
          ]}
        />

        <meshStandardMaterial
          color="#d8e1e6"
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>


      {/* RADAR DISH */}

      <mesh
        position={[
          0.2,
          6.15,
          0,
        ]}
        rotation={[
          0.4,
          0,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.75,
            0.75,
            0.08,
            32,
          ]}
        />

        <meshStandardMaterial
          color="#9eabb4"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* ANTENNA 1 */}

      <mesh
        position={[
          -0.8,
          5.1,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.05,
            0.05,
            2.5,
            12,
          ]}
        />

        <meshStandardMaterial
          color="#dce5ea"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* ANTENNA 2 */}

      <mesh
        position={[
          1.2,
          5,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.05,
            0.05,
            2.2,
            12,
          ]}
        />

        <meshStandardMaterial
          color="#dce5ea"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* FUNNEL */}

      <mesh
        position={[
          -3,
          3.3,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.65,
            0.8,
            2.2,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#253c4d"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>


      <mesh
        position={[
          -3,
          4.45,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            0.75,
            0.65,
            0.35,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#101b25"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>


      {/* DECK */}

      <mesh
        position={[
          3,
          1.25,
          0,
        ]}
      >
        <boxGeometry
          args={[
            2.5,
            0.25,
            2.6,
          ]}
        />

        <meshStandardMaterial
          color="#71818b"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>


      {/* LIFEBOAT */}

      <mesh
        position={[
          -2,
          2.1,
          -1.6,
        ]}
      >
        <capsuleGeometry
          args={[
            0.35,
            1.4,
            8,
            16,
          ]}
        />

        <meshStandardMaterial
          color="#ff7b35"
          metalness={0.2}
          roughness={0.45}
        />
      </mesh>


      {/* CRANE */}

      <mesh
        position={[
          3.1,
          2.6,
          1.1,
        ]}
      >
        <cylinderGeometry
          args={[
            0.12,
            0.12,
            2.8,
            16,
          ]}
        />

        <meshStandardMaterial
          color="#9da9ae"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>


      <mesh
        position={[
          3.8,
          3.8,
          1.1,
        ]}
        rotation={[
          0,
          0,
          -0.6,
        ]}
      >
        <cylinderGeometry
          args={[
            0.1,
            0.1,
            2.2,
            16,
          ]}
        />

        <meshStandardMaterial
          color="#9da9ae"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>


      {/* VESSEL LIGHTS */}

      <pointLight
        position={[
          4,
          1.5,
          -1.5,
        ]}
        intensity={
          18 * lightScale
        }
        distance={25}
        color="#ffffff"
      />

      <pointLight
        position={[
          -1,
          3,
          -1.5,
        ]}
        intensity={
          12 * lightScale
        }
        distance={20}
        color="#8bdcff"
      />

      {!subdued && (
        <>
          <pointLight
            position={[
              0,
              0,
              0,
            ]}
            intensity={10}
            distance={18}
            color="#1599ff"
          />

          <pointLight
            position={[
              1,
              -1.5,
              0,
            ]}
            intensity={20}
            distance={15}
            color="#0077ff"
          />
        </>
      )}
    </group>
  );
}


/* =========================================================
   FLEET VESSEL
========================================================= */

function FleetVessel({
  id,
  name,
  detail,
  position,
  heading,
  scale,
  subdued = false,
  phase = 0,
  selected = false,
  onSelect,
  onHover,
}: {
  id: string;
  name: string;
  detail: string;
  position: [
    number,
    number,
    number
  ];
  heading: number;
  scale: number;
  subdued?: boolean;
  phase?: number;
  selected?: boolean;
  onSelect?: (entity: SelectedEntity) => void;
  onHover?: (entity: SelectedEntity) => void;
}) {
  const groupRef =
    useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current)
      return;

    const t =
      state.clock.elapsedTime;

    groupRef.current.position.set(
      position[0] +
        Math.sin(
          t * 0.07 + phase
        ) *
          0.18,

      position[1] +
        Math.sin(
          t * 0.32 +
            phase * 1.7
        ) *
          0.035,

      position[2] +
        Math.cos(
          t * 0.05 +
            phase * 1.2
        ) *
          0.14
    );

    groupRef.current.rotation.y =
      heading +
      Math.sin(
        t * 0.04 + phase
      ) *
        0.015;

    const targetScale = scale * (selected ? 1.09 : 1);
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    );
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover?.({ kind: "Vessel", id, name, detail });
      }}
      onPointerOut={() => onHover?.(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.({ kind: "Vessel", id, name, detail });
      }}
    >
      <Vessel
        subdued={subdued}
      />

      {selected && (
        <>
          <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.4, 5.1, 40]} />
            <meshBasicMaterial color="#4dd4e8" transparent opacity={0.72} depthWrite={false} />
          </mesh>
          <pointLight position={[0, 1, 0]} color="#4dd4e8" intensity={8} distance={14} />
        </>
      )}
    </group>
  );
}


/* =========================================================
   DETERMINISTIC RANDOM
========================================================= */

function icebergRand(
  seed: number,
  n: number
) {
  const x =
    Math.sin(
      seed * 127.1 +
        n * 311.7
    ) *
    43758.5453;

  return (
    x - Math.floor(x)
  );
}


/* =========================================================
   NATURAL ANTARCTIC ICEBERG
========================================================= */

function Iceberg({
  position,
  scale = 1,
  rotation = 0,
  seed = 1,
  selected = false,
  onSelect,
  onHover,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
  seed?: number;
  selected?: boolean;
  onSelect?: (entity: SelectedEntity) => void;
  onHover?: (entity: SelectedEntity) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  /*
   * A low-poly convex ice mass is much closer to a real drifting iceberg
   * than the old repeated dodecahedron/crystal look.
   */
  const geometryData = useMemo(() => {
    const makeMass = (
      massSeed: number,
      width: number,
      height: number,
      depth: number,
    ) => {
      const points: THREE.Vector3[] = [];

      // Broad submerged/near-water body.
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = 0.78 + icebergRand(massSeed, 10 + i) * 0.42;
        points.push(
          new THREE.Vector3(
            Math.cos(a) * width * r,
            -0.65 + icebergRand(massSeed, 40 + i) * 0.9,
            Math.sin(a) * depth * r,
          ),
        );
      }

      // Uneven above-water crown: several chunks with different heights.
      for (let i = 0; i < 11; i++) {
        const a = icebergRand(massSeed, 80 + i) * Math.PI * 2;
        const r = 0.12 + icebergRand(massSeed, 100 + i) * 0.62;
        const localHeight =
          height *
          (0.42 + icebergRand(massSeed, 120 + i) * 0.58);

        points.push(
          new THREE.Vector3(
            Math.cos(a) * width * r,
            0.05 + localHeight,
            Math.sin(a) * depth * r,
          ),
        );
      }

      // A few offset peaks keep the silhouette asymmetric.
      for (let i = 0; i < 4; i++) {
        points.push(
          new THREE.Vector3(
            (icebergRand(massSeed, 150 + i) - 0.5) * width * 1.25,
            0.25 + height * (0.45 + icebergRand(massSeed, 160 + i) * 0.55),
            (icebergRand(massSeed, 170 + i) - 0.5) * depth * 1.2,
          ),
        );
      }

      return new ConvexGeometry(points);
    };

    return {
      body: makeMass(seed * 17 + 1, 2.25, 2.7, 1.75),
      crown: makeMass(seed * 17 + 2, 1.45, 2.0, 1.15),
    };
  }, [seed]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    groupRef.current.position.y =
      position[1] +
      Math.sin(
        t * 0.22 +
          position[0] * 0.025 +
          position[2] * 0.018,
      ) *
        0.06;

    groupRef.current.rotation.y =
      rotation +
      Math.sin(t * 0.07 + seed) * 0.018;
    groupRef.current.rotation.z =
      Math.sin(t * 0.11 + seed * 0.7) * 0.012;
  });

  const mainColor =
    seed % 3 === 0 ? "#b9ddea" : seed % 2 === 0 ? "#d9eef5" : "#c8e6ef";
  const id = `iceberg-${seed}`;
  const name = seed === 42 ? "ICEBERG 001 — SCENARIO TARGET" : `ICEBERG ${String(seed).padStart(3, "0")}`;
  const detail = seed === 42
    ? "SIMULATED drift forecast: Route A interception window at +12h."
    : "SIMULATED iceberg field object. Select to inspect its scenario classification.";

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover?.({ kind: "Iceberg", id, name, detail });
      }}
      onPointerOut={() => onHover?.(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.({ kind: "Iceberg", id, name, detail });
      }}
    >
      {/* Darker submerged mass: gives the iceberg believable depth. */}
      <mesh position={[0, -0.9, 0]} geometry={geometryData.body}>
        <meshStandardMaterial
          color="#4f8ca5"
          roughness={0.8}
          metalness={0.02}
          transparent
          opacity={0.46}
          depthWrite={false}
        />
      </mesh>

      {/* Main visible ice body. */}
      <mesh position={[0, 0.15, 0]} geometry={geometryData.body}>
        <meshStandardMaterial
          color={mainColor}
          roughness={0.62}
          metalness={0.01}
          flatShading
        />
      </mesh>

      {/* Uneven bright upper chunk. */}
      <mesh
        position={[
          (icebergRand(seed, 301) - 0.5) * 1.0,
          0.65 + icebergRand(seed, 302) * 0.45,
          (icebergRand(seed, 303) - 0.5) * 0.8,
        ]}
        rotation={[
          (icebergRand(seed, 304) - 0.5) * 0.25,
          icebergRand(seed, 305) * Math.PI,
          (icebergRand(seed, 306) - 0.5) * 0.22,
        ]}
        geometry={geometryData.crown}
      >
        <meshStandardMaterial
          color="#edf8fb"
          roughness={0.5}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* Small broken floe/chunk attached to the side. */}
      <mesh
        position={[
          1.55,
          0.25,
          -0.7,
        ]}
        rotation={[0.12, icebergRand(seed, 320) * Math.PI, -0.08]}
        scale={[0.55, 0.34, 0.7]}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#dff3f8"
          roughness={0.58}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* Subtle cold-blue contact glow, not a neon game asset. */}
      <pointLight
        position={[0, -0.15, 0]}
        intensity={1.8}
        distance={7}
        color="#8bdcff"
      />

      {selected && (
        <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.6, 3.1, 40]} />
          <meshBasicMaterial color="#ff9b68" transparent opacity={0.86} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/* =========================================================
   ROUTES
========================================================= */

function SafeRoute({
  selectedRoute,
  onSelectRoute,
}: {
  selectedRoute: string;
  onSelectRoute: (routeId: string) => void;
}) {

  /*
   * ROUTE B
   * Recommended route.
   */

  const routeBPoints = [
    new THREE.Vector3(
      4.6,
      2.6,
      2
    ),

    new THREE.Vector3(
      -5,
      2.6,
      -14
    ),

    new THREE.Vector3(
      -20,
      2.6,
      -30
    ),

    new THREE.Vector3(
      -25,
      2.6,
      -48
    ),

    new THREE.Vector3(
      -16,
      2.6,
      -66
    ),

    new THREE.Vector3(
      4,
      2.6,
      -80
    ),

    new THREE.Vector3(
      28,
      2.6,
      -91
    ),

    new THREE.Vector3(
      50,
      2.6,
      -101
    ),
  ];


  /*
   * ROUTE A
   * Direct route through predicted hazard.
   */

  const routeAPoints = [
    new THREE.Vector3(
      4.6,
      2.6,
      2
    ),

    new THREE.Vector3(
      7,
      2.6,
      -12
    ),

    new THREE.Vector3(
      14,
      2.6,
      -25
    ),

    new THREE.Vector3(
      21,
      2.6,
      -38
    ),

    new THREE.Vector3(
      32,
      2.6,
      -54
    ),

    new THREE.Vector3(
      45,
      2.6,
      -71
    ),

    new THREE.Vector3(
      59,
      2.6,
      -87
    ),

    new THREE.Vector3(
      72,
      2.6,
      -102
    ),
  ];


  /*
   * ROUTE C
   * Longer alternative.
   */

  const routeCPoints = [
    new THREE.Vector3(
      4.6,
      2.6,
      2
    ),

    new THREE.Vector3(
      14,
      2.6,
      -13
    ),

    new THREE.Vector3(
      30,
      2.6,
      -28
    ),

    new THREE.Vector3(
      44,
      2.6,
      -45
    ),

    new THREE.Vector3(
      55,
      2.6,
      -63
    ),

    new THREE.Vector3(
      66,
      2.6,
      -80
    ),

    new THREE.Vector3(
      76,
      2.6,
      -96
    ),

    new THREE.Vector3(
      84,
      2.6,
      -110
    ),
  ];


  const routeBCurve =
    new THREE.CatmullRomCurve3(
      routeBPoints
    );

  const routeACurve =
    new THREE.CatmullRomCurve3(
      routeAPoints
    );

  const routeCCurve =
    new THREE.CatmullRomCurve3(
      routeCPoints
    );


  const routeBGeometry =
    new THREE.TubeGeometry(
      routeBCurve,
      220,
      0.16,
      10,
      false
    );

  const routeAGeometry =
    new THREE.TubeGeometry(
      routeACurve,
      220,
      0.12,
      10,
      false
    );

  const routeCGeometry =
    new THREE.TubeGeometry(
      routeCCurve,
      220,
      0.12,
      10,
      false
    );


  return (
    <group>

      {/* ROUTE A — HIGH RISK */}

      <mesh
        geometry={
          routeAGeometry
        }
        onClick={(event) => {
          event.stopPropagation();
          onSelectRoute("route-a");
        }}
      >
        <meshBasicMaterial
          color="#ff4141"
          toneMapped={false}
          transparent
          opacity={selectedRoute === "route-a" ? 1 : 0.52}
        />
      </mesh>


      {/* ROUTE C — MODERATE */}

      <mesh
        geometry={
          routeCGeometry
        }
        onClick={(event) => {
          event.stopPropagation();
          onSelectRoute("route-c");
        }}
      >
        <meshBasicMaterial
          color="#ffb347"
          toneMapped={false}
          transparent
          opacity={selectedRoute === "route-c" ? 1 : 0.52}
        />
      </mesh>


      {/* ROUTE B — RECOMMENDED */}

      <mesh
        geometry={
          routeBGeometry
        }
        onClick={(event) => {
          event.stopPropagation();
          onSelectRoute("route-b");
        }}
      >
        <meshBasicMaterial
          color="#00f5c8"
          toneMapped={false}
          transparent
          opacity={selectedRoute === "route-b" ? 1 : 0.62}
        />
      </mesh>


      {/* ROUTE B WAYPOINTS */}

      {routeBPoints.map(
        (point, index) => (
          <mesh
            key={`waypoint-${index}`}
            position={point}
          >
            <sphereGeometry
              args={[
                0.22,
                12,
                12,
              ]}
            />

            <meshBasicMaterial
              color="#00f5c8"
              toneMapped={false}
            />
          </mesh>
        )
      )}


      {/* DESTINATION */}

      <mesh
        position={
          routeBPoints[
            routeBPoints.length - 1
          ]
        }
      >
        <sphereGeometry
          args={[
            0.55,
            24,
            24,
          ]}
        />

        <meshBasicMaterial
          color="#00f5c8"
          toneMapped={false}
        />
      </mesh>


      <mesh
        position={
          routeBPoints[
            routeBPoints.length - 1
          ]
        }
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            0.75,
            1.05,
            32,
          ]}
        />

        <meshBasicMaterial
          color="#00f5c8"
          toneMapped={false}
          transparent
          opacity={0.85}
        />
      </mesh>

    </group>
  );
}


/* =========================================================
   ICEBERG TRAJECTORY
========================================================= */

function IcebergTrajectory({ activeStep }: { activeStep: ScenarioStep }) {
  /*
   * The predicted drift is deliberately placed across the operational
   * route area so the interception scenario is immediately readable.
   *
   * NOW → +6H → +12H → +24H
   */
  const points = useMemo(
    () => icebergTrajectoryPoints.map(([x, , z]) => new THREE.Vector3(x, 3.2, z)),
    [],
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const activeIndex = scenarioSteps.indexOf(activeStep);

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 120, 0.24, 12, false),
    [curve],
  );

  const glowGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 120, 0.55, 10, false),
    [curve],
  );

  return (
    <group>
      {/* Wide soft glow makes the forecast visible over the ocean/ice. */}
      <mesh geometry={glowGeometry}>
        <meshBasicMaterial
          color="#ff7b45"
          toneMapped={false}
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>

      {/* Main amber prediction line. */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#ff7a3d"
          toneMapped={false}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Direction arrows. */}
      {[0.16, 0.36, 0.56, 0.76].map((t) => {
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        const quaternion = new THREE.Quaternion();

        quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          tangent,
        );

        return (
          <mesh
            key={`arrow-${t}`}
            position={point}
            quaternion={quaternion}
          >
            <coneGeometry args={[0.5, 1.35, 8]} />
            <meshBasicMaterial
              color="#ffc08f"
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Forecast checkpoints. */}
      {points.map((point, index) => (
        <group key={`trajectory-point-${index}`}>
          <mesh position={point}>
            <sphereGeometry
              args={[index === 0 ? 0.62 : 0.42, 24, 24]}
            />
            <meshBasicMaterial
              color={index === activeIndex ? "#fff0d8" : index === 0 ? "#ff3d24" : "#ff9b68"}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>

          <mesh
            position={[point.x, 0.03, point.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry
              args={[
                index === 0 ? 0.85 : 0.62,
                index === 0 ? 1.15 : 0.82,
                40,
              ]}
            />
            <meshBasicMaterial
              color="#ff7a45"
              toneMapped={false}
              transparent
              opacity={0.82}
              depthWrite={false}
            />
          </mesh>

          <mesh
            position={[point.x, point.y - 1.0, point.z]}
          >
            <cylinderGeometry args={[0.055, 0.055, 2.0, 8]} />
            <meshBasicMaterial
              color="#ff9a68"
              toneMapped={false}
              transparent
              opacity={0.72}
              depthWrite={false}
            />
          </mesh>

          <Html position={[point.x, point.y + 1.1, point.z]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
            <div className={`trajectory-label ${index === activeIndex ? "active" : ""}`}>
              {scenarioSteps[index]}
            </div>
          </Html>
        </group>
      ))}

      {/* Large terminal target makes +24H unmistakable. */}
      <mesh
        position={points[points.length - 1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.05, 1.45, 40]} />
        <meshBasicMaterial
          color="#ff5f3a"
          toneMapped={false}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   SMALL FLOATING ICE
========================================================= */

function FloatingIce({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: [
    number,
    number,
    number
  ];
  scale?: number;
  rotation?: number;
}) {
  const iceRef =
    useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!iceRef.current)
      return;

    const t =
      state.clock.elapsedTime;

    iceRef.current.position.y =
      position[1] +
      Math.sin(
        t * 0.5 +
          position[0] +
          position[2]
      ) *
        0.04;

    iceRef.current.rotation.y =
      rotation +
      t * 0.025;
  });

  return (
    <group
      ref={iceRef}
      position={position}
      scale={scale}
    >

      <mesh
        rotation={[
          0.15,
          rotation,
          0,
        ]}
      >
        <dodecahedronGeometry
          args={[
            1.15,
            1,
          ]}
        />

        <meshStandardMaterial
          color="#d5f1fc"
          metalness={0.02}
          roughness={0.34}
        />
      </mesh>


      <mesh
        position={[
          0.3,
          -0.15,
          0.2,
        ]}
        scale={[
          0.7,
          0.35,
          0.8,
        ]}
      >
        <icosahedronGeometry
          args={[
            0.9,
            1,
          ]}
        />

        <meshStandardMaterial
          color="#91cde4"
          metalness={0.02}
          roughness={0.4}
        />
      </mesh>

    </group>
  );
}


/* =========================================================
   SCENE
========================================================= */

function Scene({
  seaIcePrediction,
  selectedEntity,
  hoveredEntity,
  selectedRoute,
  scenarioStep,
  onSelectEntity,
  onHoverEntity,
  onSelectRoute,
}: {
  seaIcePrediction:
    LoadState["data"];
  selectedEntity: SelectedEntity;
  hoveredEntity: SelectedEntity;
  selectedRoute: string;
  scenarioStep: ScenarioStep;
  onSelectEntity: (entity: SelectedEntity) => void;
  onHoverEntity: (entity: SelectedEntity) => void;
  onSelectRoute: (routeId: string) => void;
}) {
  const highlightedEntity = hoveredEntity ?? selectedEntity;
  const trajectoryIndex = scenarioSteps.indexOf(scenarioStep);
  const hazardPosition = icebergTrajectoryPoints[trajectoryIndex];

  return (
    <>

      {/* =================================================
          POLAR NIGHT
      ================================================= */}

      <color
        attach="background"
        args={[
          "#020b18",
        ]}
      />

      <fog
        attach="fog"
        args={[
          "#06172b",
          75,
          320,
        ]}
      />


      {/* =================================================
          LIGHTING
      ================================================= */}

      <ambientLight
        intensity={0.2}
        color="#527ba8"
      />

      <directionalLight
        position={[
          -40,
          50,
          -80,
        ]}
        intensity={1.7}
        color="#9ecbff"
      />


      {/* =================================================
          MOVING OCEAN
      ================================================= */}

      <Ocean />


      {/* =================================================
          REAL PREDICTED SEA ICE
      ================================================= */}

      {seaIcePrediction && (
        <SeaIceLayer
          prediction={
            seaIcePrediction
          }
        />
      )}


{/* =================================================
    FLEET
================================================= */}

{/* PRIMARY POLAR RESEARCH / ICE OPERATIONS VESSEL */}
<FleetVessel
  id="vessel-primary"
  name="RV POLAR EXPLORER"
  detail="PRIMARY VESSEL · simulated operational telemetry · 12.3 kn · heading 285°"
  position={[0, 2, 2]}
  heading={0.18}
  scale={1}
  phase={0}
  selected={highlightedEntity?.id === "vessel-primary"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* HEAVY ICEBREAKER */}
<FleetVessel
  id="vessel-icebreaker"
  name="ANTARCTIC ICEBREAKER"
  detail="HEAVY ICEBREAKER · simulated operational telemetry · 14.2 kn · heading 320°"
  position={[-43, 2, -42]}
  heading={0.86}
  scale={0.82}
  subdued
  phase={1.5}
  selected={highlightedEntity?.id === "vessel-icebreaker"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* RESEARCH SUPPORT VESSEL */}
<FleetVessel
  id="vessel-support"
  name="RESEARCH SUPPORT VESSEL"
  detail="RESEARCH SUPPORT · simulated operational telemetry · 10.8 kn · heading 195°"
  position={[47, 2, -52]}
  heading={-0.62}
  scale={0.72}
  subdued
  phase={2.8}
  selected={highlightedEntity?.id === "vessel-support"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* RESUPPLY VESSEL */}
<FleetVessel
  id="vessel-resupply"
  name="RESUPPLY VESSEL"
  detail="POLAR RESUPPLY · simulated operational telemetry · 11.5 kn · heading 045°"
  position={[-34, 2, 31]}
  heading={1.18}
  scale={0.7}
  subdued
  phase={4.2}
  selected={highlightedEntity?.id === "vessel-resupply"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* DISTANT RESEARCH VESSEL */}
<FleetVessel
  id="vessel-distant"
  name="DISTANT RESEARCH VESSEL"
  detail="RESEARCH VESSEL · simulated operational telemetry · 9.7 kn · heading 110°"
  position={[52, 2, 24]}
  heading={-1.04}
  scale={0.58}
  subdued
  phase={5.6}
  selected={highlightedEntity?.id === "vessel-distant"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* =================================================
    NAVIGATION ROUTES
================================================= */}
<SafeRoute selectedRoute={selectedRoute} onSelectRoute={onSelectRoute} />

{/* =================================================
    PREDICTED ICEBERG DRIFT
================================================= */}
<IcebergTrajectory activeStep={scenarioStep} />

{/* =================================================
    MAJOR NAVIGATION HAZARD
================================================= */}

{/* This is the iceberg the orange forecast line is tracking. */}
<Iceberg
  position={hazardPosition}
  scale={2.2}
  rotation={0.55}
  seed={42}
  selected={highlightedEntity?.id === "iceberg-42"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* =================================================
    NATURAL ICEBERG FIELD
    Irregular distribution — no ring/circle.
================================================= */}

<Iceberg
  position={[-27, 0, -42]}
  scale={1.5}
  rotation={1.1}
  seed={1}
  selected={highlightedEntity?.id === "iceberg-1"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[42, 0, -49]}
  scale={1.4}
  rotation={1.9}
  seed={2}
  selected={highlightedEntity?.id === "iceberg-2"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[-6, 0, -72]}
  scale={1.2}
  rotation={0.6}
  seed={3}
  selected={highlightedEntity?.id === "iceberg-3"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[64, 0, -78]}
  scale={1.15}
  rotation={2.25}
  seed={4}
  selected={highlightedEntity?.id === "iceberg-4"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[-62, 0, -66]}
  scale={1.05}
  rotation={1.6}
  seed={5}
  selected={highlightedEntity?.id === "iceberg-5"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[70, 0, -25]}
  scale={0.95}
  rotation={2.0}
  seed={6}
  selected={highlightedEntity?.id === "iceberg-6"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[-60, 0, -18]}
  scale={0.9}
  rotation={0.4}
  seed={7}
  selected={highlightedEntity?.id === "iceberg-7"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[42, 0, 35]}
  scale={0.85}
  rotation={2.1}
  seed={8}
  selected={highlightedEntity?.id === "iceberg-8"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[-45, 0, 30]}
  scale={0.8}
  rotation={1.0}
  seed={9}
  selected={highlightedEntity?.id === "iceberg-9"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* =================================================
    SMALLER ICE CLUSTER NEAR HAZARD
================================================= */}

<Iceberg
  position={[28, 0, -28]}
  scale={0.72}
  rotation={1.3}
  seed={12}
  selected={highlightedEntity?.id === "iceberg-12"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[-35, 0, -65]}
  scale={0.64}
  rotation={0.9}
  seed={13}
  selected={highlightedEntity?.id === "iceberg-13"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

<Iceberg
  position={[18, 0, -52]}
  scale={0.68}
  rotation={1.8}
  seed={14}
  selected={highlightedEntity?.id === "iceberg-14"}
  onSelect={onSelectEntity}
  onHover={onHoverEntity}
/>

{/* =================================================
    SCATTERED SMALL FLOATING ICE
================================================= */}

<FloatingIce position={[-45, 0.05, -28]} scale={0.45} rotation={0.8} />
<FloatingIce position={[56, 0.05, -38]} scale={0.48} rotation={1.6} />
<FloatingIce position={[-36, 0.05, -58]} scale={0.52} rotation={2.2} />
<FloatingIce position={[61, 0.05, -62]} scale={0.46} rotation={0.4} />
<FloatingIce position={[-17, 0.05, -84]} scale={0.42} rotation={1.3} />
<FloatingIce position={[48, 0.05, -82]} scale={0.45} rotation={2.1} />
<FloatingIce position={[-55, 0.05, 8]} scale={0.42} rotation={2.4} />
<FloatingIce position={[33, 0.05, 43]} scale={0.4} rotation={1.1} />
<FloatingIce position={[-68, 0.05, -45]} scale={0.46} rotation={0.7} />
<FloatingIce position={[72, 0.05, -8]} scale={0.42} rotation={1.8} />

      {/* =================================================
          MOON
      ================================================= */}

      <Moon />


      {/* =================================================
          STARS
      ================================================= */}

      <Stars />


      {/* =================================================
          CAMERA
      ================================================= */}

      <OrbitControls
        enableDamping
        target={[4, 0, -32]}
        minDistance={8}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.05}
      />

    </>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  const [
    loadState,
    setLoadState,
  ] =
    useState<LoadState>({
      status: "loading",
      data: null,
      error: null,
    });


  const [
    activeNav,
    setActiveNav,
  ] =
    useState(
      "OVERVIEW"
    );

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [hoveredEntity, setHoveredEntity] = useState<SelectedEntity>(null);
  const [selectedRoute, setSelectedRoute] = useState("route-b");
  const [scenarioStep, setScenarioStep] = useState<ScenarioStep>("NOW");
  const displayedEntity = hoveredEntity ?? selectedEntity;


  /*
   * Load the processed POLARIS
   * sea-ice prediction.
   */

  useEffect(() => {

    loadSeaIcePrediction()

      .then((data) => {

        setLoadState({
          status: "success",
          data,
          error: null,
        });

      })

      .catch((error) => {

        console.error(
          "Failed to load sea-ice prediction:",
          error
        );

        setLoadState({
          status: "error",
          data: null,
          error:
            error.message ||
            "Unknown error",
        });

      });

  }, []);


  return (
    <div className="polaris-dashboard">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <TopBar />


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        activeItem={activeNav}
        onItemClick={
          setActiveNav
        }
      />


      {/* =================================================
          CENTRAL 3D OPERATIONAL VIEW
      ================================================= */}

      <div className="polaris-main">

        <Canvas
          camera={{
            position: [
              2,
              23,
              62,
            ],

            fov: 52,

            near: 0.1,

            far: 20000,
          }}

          gl={{
            antialias: true,
          }}

          style={{
            width: "100%",
            height: "100%",
          }}
          onPointerMissed={() => {
            setSelectedEntity(null);
            setHoveredEntity(null);
          }}
        >

          <Scene
            seaIcePrediction={
              loadState.data
            }
            selectedEntity={selectedEntity}
            hoveredEntity={hoveredEntity}
            selectedRoute={selectedRoute}
            scenarioStep={scenarioStep}
            onSelectEntity={setSelectedEntity}
            onHoverEntity={setHoveredEntity}
            onSelectRoute={setSelectedRoute}
          />

        </Canvas>

        {displayedEntity && (
          <div className="scene-selection-card">
            <div className="scene-selection-kind">{displayedEntity.kind} · SIMULATED SCENARIO</div>
            <div className="scene-selection-name">{displayedEntity.name}</div>
            <div className="scene-selection-detail">{displayedEntity.detail}</div>
          </div>
        )}

      </div>


      {/* =================================================
          RIGHT OPERATIONAL PANEL
      ================================================= */}

      {activeNav ===
        "LIVE NAVIGATION" ||
      activeNav ===
        "OVERVIEW" ? (

        <RightPanel
          seaIcePrediction={
            loadState.data
          }
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
        />

      ) : (

        <div className="polaris-rightpanel">

          <ContextualPanel
            activeView={
              activeNav
            }
          />

        </div>

      )}


      {/* =================================================
          STATUS
      ================================================= */}

      <StatusBar />


      {/* =================================================
          TIME CONTROL
      ================================================= */}

      <Timeline activeStep={scenarioStep} onStepChange={setScenarioStep} />

      <ExplanationSection />



      {/* =================================================
          CONNECTION STATUS
      ================================================= */}

      <ConnectionStatus />

    </div>
  );
}
