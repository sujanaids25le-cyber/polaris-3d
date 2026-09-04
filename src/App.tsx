import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Water } from "three/addons/objects/Water.js";
import * as THREE from "three";
import { useMemo, useRef } from "react";


/* =========================================================
   OCEAN
========================================================= */

function Ocean() {
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://threejs.org/examples/textures/waternormals.jpg"
  );

  waterNormals.wrapS = THREE.RepeatWrapping;
  waterNormals.wrapT = THREE.RepeatWrapping;

  const water = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(10000, 10000);

    const waterObject = new Water(geometry, {
      textureWidth: 1024,
      textureHeight: 1024,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(0.3, 1, 0.2).normalize(),
      sunColor: 0x9fcfff,
      waterColor: 0x07528a,
      distortionScale: 3.3,
      fog: true,
    });

    waterObject.rotation.x = -Math.PI / 2;

    return waterObject;
  }, [waterNormals]);

  useFrame((_, delta) => {
    water.material.uniforms.time.value += delta;
  });

  return <primitive object={water} />;
}


/* =========================================================
   MOON
========================================================= */

function Moon() {
  return (
    <>
      <mesh position={[0, 35, -80]}>
        <sphereGeometry args={[8, 64, 64]} />
        <meshBasicMaterial color="#dcecff" />
      </mesh>

      <pointLight
        position={[0, 35, -60]}
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

    for (let i = 0; i < 700; i++) {
      positions.push(
        (Math.random() - 0.5) * 500,
        Math.random() * 100 + 20,
        -Math.random() * 320 - 20
      );
    }

    return new Float32Array(positions);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[stars, 3]}
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

function Vessel() {
  return (
    <group
      position={[0, 2, 5]}
      rotation={[0, 0, 0]}
      scale={0.9}
    >

      {/* MAIN HULL */}

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[9, 1.8, 3]} />

        <meshStandardMaterial
          color="#173b5c"
          metalness={0.7}
          roughness={0.28}
        />
      </mesh>


      {/* RED ICEBREAKER HULL */}

      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[8.5, 0.7, 2.8]} />

        <meshStandardMaterial
          color="#8b2635"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>


      {/* WHITE BOW */}

      <mesh position={[3.9, 0.45, 0]}>
        <boxGeometry args={[1.8, 1.4, 2.8]} />

        <meshStandardMaterial
          color="#e8f1f5"
          metalness={0.45}
          roughness={0.3}
        />
      </mesh>


      {/* POINTED BOW */}

      <mesh
        position={[5.1, 0.1, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[1.45, 2.5, 4]} />

        <meshStandardMaterial
          color="#dce8ed"
          metalness={0.6}
          roughness={0.28}
        />
      </mesh>


      {/* SUPERSTRUCTURE */}

      <mesh position={[-0.8, 1.55, 0]}>
        <boxGeometry args={[5.5, 2.2, 2.5]} />

        <meshStandardMaterial
          color="#e9f0f4"
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>


      {/* BLUE STRIPE */}

      <mesh position={[-0.8, 0.75, -1.28]}>
        <boxGeometry args={[5.6, 0.35, 0.08]} />

        <meshStandardMaterial
          color="#1467a5"
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>


      {/* BRIDGE */}

      <mesh position={[0.2, 3.05, 0]}>
        <boxGeometry args={[4.2, 1.5, 2.3]} />

        <meshStandardMaterial
          color="#f3f6f7"
          metalness={0.35}
          roughness={0.3}
        />
      </mesh>


      {/* BRIDGE WINDOWS */}

      <mesh position={[0.2, 3.25, -1.18]}>
        <boxGeometry args={[3.5, 0.65, 0.08]} />

        <meshStandardMaterial
          color="#172b3b"
          emissive="#0b6fa8"
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>


      {/* SIDE WINDOWS */}

      <mesh position={[-1.9, 3.25, 0]}>
        <boxGeometry args={[0.08, 0.65, 1.6]} />

        <meshStandardMaterial
          color="#172b3b"
          emissive="#0b6fa8"
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>


      {/* RADAR TOWER */}

      <mesh position={[0.2, 4.5, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 2.2, 16]} />

        <meshStandardMaterial
          color="#b8c5ce"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* RADAR DOME */}

      <mesh position={[0.2, 5.65, 0]}>
        <sphereGeometry args={[0.5, 32, 16]} />

        <meshStandardMaterial
          color="#d8e1e6"
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>


      {/* RADAR DISH */}

      <mesh
        position={[0.2, 6.15, 0]}
        rotation={[0.4, 0, 0]}
      >
        <cylinderGeometry args={[0.75, 0.75, 0.08, 32]} />

        <meshStandardMaterial
          color="#9eabb4"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* ANTENNA 1 */}

      <mesh position={[-0.8, 5.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 12]} />

        <meshStandardMaterial
          color="#dce5ea"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* ANTENNA 2 */}

      <mesh position={[1.2, 5.0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.2, 12]} />

        <meshStandardMaterial
          color="#dce5ea"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>


      {/* FUNNEL */}

      <mesh position={[-3, 3.3, 0]}>
        <cylinderGeometry args={[0.65, 0.8, 2.2, 24]} />

        <meshStandardMaterial
          color="#253c4d"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>


      <mesh position={[-3, 4.45, 0]}>
        <cylinderGeometry args={[0.75, 0.65, 0.35, 24]} />

        <meshStandardMaterial
          color="#101b25"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>


      {/* DECK */}

      <mesh position={[3, 1.25, 0]}>
        <boxGeometry args={[2.5, 0.25, 2.6]} />

        <meshStandardMaterial
          color="#71818b"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>


      {/* LIFEBOAT */}

      <mesh position={[-2, 2.1, -1.6]}>
        <capsuleGeometry args={[0.35, 1.4, 8, 16]} />

        <meshStandardMaterial
          color="#ff7b35"
          metalness={0.2}
          roughness={0.45}
        />
      </mesh>


      {/* CRANE */}

      <mesh position={[3.1, 2.6, 1.1]}>
        <cylinderGeometry args={[0.12, 0.12, 2.8, 16]} />

        <meshStandardMaterial
          color="#9da9ae"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>


      <mesh
        position={[3.8, 3.8, 1.1]}
        rotation={[0, 0, -0.6]}
      >
        <cylinderGeometry args={[0.1, 0.1, 2.2, 16]} />

        <meshStandardMaterial
          color="#9da9ae"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>


      {/* VESSEL LIGHTS */}

      <pointLight
        position={[4, 1.5, -1.5]}
        intensity={18}
        distance={25}
        color="#ffffff"
      />

      <pointLight
        position={[-1, 3, -1.5]}
        intensity={12}
        distance={20}
        color="#8bdcff"
      />

      <pointLight
        position={[0, 0, 0]}
        intensity={10}
        distance={18}
        color="#1599ff"
      />

      <pointLight
        position={[1, -1.5, 0]}
        intensity={20}
        distance={15}
        color="#0077ff"
      />

    </group>
  );
}


/* =========================================================
   REALISTIC TRIANGULAR ICEBERG
========================================================= */
/* =========================================================
   REALISTIC ICEBERG
========================================================= */

function Iceberg({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.position.y =
      position[1] +
      Math.sin(
        state.clock.elapsedTime * 0.35 +
        position[0] * 0.1
      ) * 0.06;

    groupRef.current.rotation.y =
      rotation +
      Math.sin(
        state.clock.elapsedTime * 0.12 +
        position[2]
      ) * 0.025;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
    >

      {/* ===============================
          MAIN TALL ICE PEAK
      =============================== */}

      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[3.4, 8.5, 6]} />

        <meshStandardMaterial
          color="#bfe9ff"
          metalness={0.05}
          roughness={0.22}
          transparent
          opacity={0.95}
          emissive="#246b91"
          emissiveIntensity={0.25}
        />
      </mesh>


      {/* ===============================
          TALL LEFT PEAK
      =============================== */}

      <mesh
        position={[-2.2, 2.6, 0.2]}
        rotation={[0.05, 0.4, -0.08]}
      >
        <coneGeometry args={[2.0, 6.8, 5]} />

        <meshStandardMaterial
          color="#9edcff"
          metalness={0.05}
          roughness={0.25}
          transparent
          opacity={0.93}
          emissive="#1d5d80"
          emissiveIntensity={0.2}
        />
      </mesh>


      {/* ===============================
          TALL RIGHT PEAK
      =============================== */}

      <mesh
        position={[2.1, 2.9, -0.2]}
        rotation={[-0.05, -0.3, 0.08]}
      >
        <coneGeometry args={[1.9, 7.3, 5]} />

        <meshStandardMaterial
          color="#b4e5ff"
          metalness={0.05}
          roughness={0.23}
          transparent
          opacity={0.94}
          emissive="#246d92"
          emissiveIntensity={0.22}
        />
      </mesh>


      {/* ===============================
          SMALL LEFT PEAK
      =============================== */}

      <mesh
        position={[-3.8, 1.6, 0.4]}
        rotation={[0.08, 0.2, -0.1]}
      >
        <coneGeometry args={[1.25, 4.2, 5]} />

        <meshStandardMaterial
          color="#c9efff"
          roughness={0.28}
          transparent
          opacity={0.92}
        />
      </mesh>


      {/* ===============================
          SMALL RIGHT PEAK
      =============================== */}

      <mesh
        position={[3.7, 1.8, -0.3]}
        rotation={[-0.08, -0.25, 0.08]}
      >
        <coneGeometry args={[1.3, 4.6, 5]} />

        <meshStandardMaterial
          color="#b9e7fb"
          roughness={0.27}
          transparent
          opacity={0.92}
        />
      </mesh>


      {/* ===============================
          FAR LEFT SMALL PEAK
      =============================== */}

      <mesh position={[-4.8, 1.0, 0.8]}>
        <coneGeometry args={[0.8, 3.0, 5]} />

        <meshStandardMaterial
          color="#d7f4ff"
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>


      {/* ===============================
          FAR RIGHT SMALL PEAK
      =============================== */}

      <mesh position={[4.8, 1.1, 0.5]}>
        <coneGeometry args={[0.9, 3.2, 5]} />

        <meshStandardMaterial
          color="#c5edff"
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>


      {/* ===============================
          LOWER ICE MASS
      =============================== */}

      <mesh
        position={[0, -0.3, 0]}
        scale={[1.45, 0.65, 1.25]}
      >
        <dodecahedronGeometry args={[3.5, 1]} />

        <meshStandardMaterial
          color="#65aeca"
          metalness={0.02}
          roughness={0.32}
          transparent
          opacity={0.9}
        />
      </mesh>


      {/* ===============================
          FLOATING ICE BASE
      =============================== */}

      <mesh
        position={[0, -1.0, 0]}
        scale={[1.6, 0.32, 1.35]}
      >
        <dodecahedronGeometry args={[3.0, 1]} />

        <meshStandardMaterial
          color="#79c1dc"
          metalness={0.02}
          roughness={0.35}
          transparent
          opacity={0.82}
        />
      </mesh>


      {/* ===============================
          SIDE ICE CHUNK
      =============================== */}

      <mesh
        position={[2.8, 0.5, 0.8]}
        rotation={[0.2, 0.5, 0.1]}
      >
        <icosahedronGeometry args={[1.1, 1]} />

        <meshStandardMaterial
          color="#a9e0f5"
          roughness={0.28}
          transparent
          opacity={0.9}
        />
      </mesh>


      {/* ===============================
          BLUE ICE LIGHT
      =============================== */}

      <pointLight
        position={[0, 1.5, 0]}
        intensity={4}
        distance={16}
        color="#55d9ff"
      />

    </group>
  );
}

/* =========================================================
   SAFE NAVIGATION ROUTE
========================================================= */
/* =========================================================
   SAFE NAVIGATION ROUTE
/* =========================================================
   SAFE NAVIGATION ROUTE — RIGHT TURN
========================================================= */

function SafeRoute() {
  /* =========================================================
   SAFE NAVIGATION CORRIDOR
========================================================= */

function SafeCorridor() {
  return (
    <mesh
      position={[0, 0.45, -37]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[8, 85]} />

      <meshBasicMaterial
        color="#39ff88"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

  const points = [
    new THREE.Vector3(4.6, 2.6, 5),       // 🚢 FRONT OF VESSEL

    new THREE.Vector3(4.6, 2.6, -8),       // straight forward

    new THREE.Vector3(5.5, 2.6, -18),      // begin turning right

    new THREE.Vector3(9.0, 2.6, -28),      // right

    new THREE.Vector3(15.0, 2.6, -38),     // continue right

    new THREE.Vector3(22.0, 2.6, -48),     // stronger right

    new THREE.Vector3(30.0, 2.6, -58),     // continue

    new THREE.Vector3(40.0, 2.6, -68),     // final direction

    new THREE.Vector3(50.0, 2.6, -78),     // 🎯 END POINT
  ];


  /* =========================
     SMOOTH CURVE
  ========================= */

  const curve =
    new THREE.CatmullRomCurve3(points);


  /* =========================
     ROUTE LINE
  ========================= */

  const geometry =
    new THREE.TubeGeometry(
      curve,
      250,
      0.14,
      10,
      false
    );


  return (
    <group>

      {/* LIGHT CYAN ROUTE */}

      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#d9ffff"
          toneMapped={false}
        />
      </mesh>


      {/* ROUTE POINTS */}

      {points.map((point, index) => (
        <mesh
          key={index}
          position={point}
        >
          <sphereGeometry
            args={[0.22, 16, 16]}
          />

          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
          />
        </mesh>
      ))}


      {/* FINAL DESTINATION POINT */}

      <mesh
        position={points[points.length - 1]}
      >
        <sphereGeometry
          args={[0.6, 32, 32]}
        />

        <meshBasicMaterial
          color="#baffff"
          toneMapped={false}
        />
      </mesh>


      {/* END POINT RING */}

      <mesh
        position={points[points.length - 1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[0.8, 1.15, 32]}
        />

        <meshBasicMaterial
          color="#a8ffff"
          transparent
          opacity={0.9}
          toneMapped={false}
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
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}) {

  const iceRef = useRef<THREE.Group>(null);

  useFrame((state) => {

    if (!iceRef.current) return;

    iceRef.current.position.y =
      position[1] +
      Math.sin(
        state.clock.elapsedTime * 0.5 +
        position[0] +
        position[2]
      ) * 0.04;

    iceRef.current.rotation.y =
      rotation +
      state.clock.elapsedTime * 0.025;

  });


  return (
    <group
      ref={iceRef}
      position={position}
      scale={scale}
    >

      <mesh
        rotation={[0.15, rotation, 0]}
      >
        <dodecahedronGeometry args={[1.15, 1]} />

        <meshStandardMaterial
          color="#d5f1fc"
          metalness={0.02}
          roughness={0.34}
        />
      </mesh>


      <mesh
        position={[0.3, -0.15, 0.2]}
        scale={[0.7, 0.35, 0.8]}
      >
        <icosahedronGeometry args={[0.9, 0]} />

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

function Scene() {
  return (
    <>

      {/* NIGHT SKY */}

      <color
        attach="background"
        args={["#020b18"]}
      />

      <fog
        attach="fog"
        args={["#06172b", 70, 320]}
      />


      {/* LIGHTING */}

      <ambientLight
        intensity={0.2}
        color="#527ba8"
      />

      <directionalLight
        position={[-40, 50, -80]}
        intensity={1.7}
        color="#9ecbff"
      />


      {/* OCEAN */}

      <Ocean />


      {/* POLARIS */}

      <Vessel />
      <SafeRoute />


      {/* =================================================
          ICEBERGS SURROUNDING POLARIS

                   🧊                         🧊

             🧊                               🧊


                         🚢


             🧊                               🧊

                   🧊             🧊

          LARGE OPEN WATER AREA
          AROUND THE VESSEL
      ================================================= */}


      {/* TOP LEFT */}

      <Iceberg
        position={[-42, 0, -95]}
        scale={2.0}
        rotation={0.4}
      />


      {/* TOP RIGHT */}

      <Iceberg
        position={[42, 0, -95]}
        scale={2.1}
        rotation={1.2}
      />


      {/* MIDDLE LEFT */}

      <Iceberg
        position={[-48, 0, -55]}
        scale={1.7}
        rotation={1.6}
      />


      {/* MIDDLE RIGHT */}

      <Iceberg
        position={[48, 0, -55]}
        scale={1.8}
        rotation={2.0}
      />


      {/* LOWER LEFT */}

      <Iceberg
        position={[-42, 0, 5]}
        scale={1.65}
        rotation={0.8}
      />


      {/* LOWER RIGHT */}

      <Iceberg
        position={[42, 0, 5]}
        scale={1.7}
        rotation={2.3}
      />


      {/* BOTTOM LEFT */}

      <Iceberg
        position={[-25, 0, 30]}
        scale={1.4}
        rotation={1.1}
      />


      {/* BOTTOM RIGHT */}

      <Iceberg
        position={[25, 0, 30]}
        scale={1.5}
        rotation={2.1}
      />


      {/* FAR CENTER */}

      <Iceberg
        position={[0, 0, -145]}
        scale={1.8}
        rotation={0.6}
      />


      {/* =================================================
          SMALL FLOATING ICE
      ================================================= */}
            {/* MORE FLOATING ICE */}

      <FloatingIce
        position={[-18, 0.05, -60]}
        scale={0.5}
        rotation={0.8}
      />

      <FloatingIce
        position={[18, 0.05, -62]}
        scale={0.55}
        rotation={1.6}
      />

      <FloatingIce
        position={[-25, 0.05, -90]}
        scale={0.65}
        rotation={2.2}
      />

      <FloatingIce
        position={[26, 0.05, -92]}
        scale={0.6}
        rotation={0.4}
      />

      <FloatingIce
        position={[-55, 0.05, -65]}
        scale={0.8}
        rotation={1.3}
      />

      <FloatingIce
        position={[55, 0.05, -68]}
        scale={0.75}
        rotation={2.1}
      />

      <FloatingIce
        position={[-58, 0.05, -105]}
        scale={0.65}
        rotation={0.5}
      />

      <FloatingIce
        position={[58, 0.05, -108]}
        scale={0.7}
        rotation={1.8}
      />

      <FloatingIce
        position={[-32, 0.05, 40]}
        scale={0.55}
        rotation={2.4}
      />

      <FloatingIce
        position={[33, 0.05, 42]}
        scale={0.6}
        rotation={1.1}
      />

      <FloatingIce
        position={[-50, 0.05, 35]}
        scale={0.7}
        rotation={0.7}
      />

      <FloatingIce
        position={[51, 0.05, 38]}
        scale={0.65}
        rotation={2.5}
      />

      <FloatingIce
        position={[-65, 0.05, -130]}
        scale={0.8}
        rotation={1.4}
      />

      <FloatingIce
        position={[65, 0.05, -135]}
        scale={0.75}
        rotation={2.0}
      />


      <FloatingIce
        position={[-30, 0.05, -75]}
        scale={0.7}
        rotation={0.3}
      />

      <FloatingIce
        position={[30, 0.05, -75]}
        scale={0.65}
        rotation={1.1}
      />

      <FloatingIce
        position={[-38, 0.05, -45]}
        scale={0.8}
        rotation={1.5}
      />

      <FloatingIce
        position={[38, 0.05, -48]}
        scale={0.7}
        rotation={2.0}
      />

      <FloatingIce
        position={[-45, 0.05, -80]}
        scale={0.6}
        rotation={0.8}
      />

      <FloatingIce
        position={[45, 0.05, -82]}
        scale={0.75}
        rotation={2.3}
      />

      <FloatingIce
        position={[-30, 0.05, 0]}
        scale={0.6}
        rotation={1.2}
      />

      <FloatingIce
        position={[31, 0.05, 2]}
        scale={0.7}
        rotation={2.1}
      />

      <FloatingIce
        position={[-35, 0.05, 25]}
        scale={0.65}
        rotation={0.6}
      />

      <FloatingIce
        position={[36, 0.05, 27]}
        scale={0.7}
        rotation={1.8}
      />

      <FloatingIce
        position={[-20, 0.05, 45]}
        scale={0.6}
        rotation={2.2}
      />

      <FloatingIce
        position={[21, 0.05, 45]}
        scale={0.65}
        rotation={0.5}
      />

      <FloatingIce
        position={[-50, 0.05, -120]}
        scale={0.7}
        rotation={1.4}
      />

      <FloatingIce
        position={[50, 0.05, -125]}
        scale={0.75}
        rotation={2.4}
      />

      <FloatingIce
        position={[-15, 0.05, -125]}
        scale={0.55}
        rotation={0.7}
      />

      <FloatingIce
        position={[16, 0.05, -130]}
        scale={0.6}
        rotation={1.9}
      />


      {/* MOON */}

      <Moon />


      {/* STARS */}

      <Stars />


      {/* CAMERA */}

      <OrbitControls
        enableDamping
        minDistance={8}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.05}
      />

    </>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >

      <Canvas
        camera={{
          position: [0, 13, 38],
          fov: 55,
          near: 0.1,
          far: 20000,
        }}
        gl={{
          antialias: true,
        }}
      >

        <Scene />

      </Canvas>

    </div>
  );
}


