<template>
  <div ref="container" class="earth-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Albedo from '../assets/Albedo.jpg'
import Bump from '../assets/Bump.jpg'
import Clouds from '../assets/Clouds.png'

const textureLoader = new THREE.TextureLoader()

// Refs
const container = ref(null)

// Constants (previously controlled by UI)
const SUN_INTENSITY = 4.0
const ROTATION_SPEED = 0.2

// Three.js variables
let scene, camera, dirLight, renderer, controls, earth, clouds, group
let animationFrameId = null

const initScene = async () => {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.z = 50
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  dirLight = new THREE.DirectionalLight(0xffffff, SUN_INTENSITY)
  dirLight.position.set(-50, 0, 30)
  scene.add(dirLight)

  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  group = new THREE.Group()
  group.rotation.z = (23.5 / 360) * 2 * Math.PI
  scene.add(group)

  // Load all textures first
  const [albedoMap, bumpMap, cloudsMap] = await Promise.all([
    textureLoader.loadAsync(Albedo),
    textureLoader.loadAsync(Bump),
    textureLoader.loadAsync(Clouds)
  ])
  albedoMap.colorSpace = THREE.SRGBColorSpace

  // Create geometries
  const sphereGeometry = new THREE.SphereGeometry(10, 64, 64)
  const cloudsGeometry = new THREE.SphereGeometry(10.05, 64, 64)

  // Create materials
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: albedoMap,
    bumpMap: bumpMap,
    bumpScale: 10,
  })
  const cloudsMaterial = new THREE.MeshStandardMaterial({
    alphaMap: cloudsMap,
    transparent: true,
  })

  // Create meshes
  earth = new THREE.Mesh(sphereGeometry, earthMaterial)
  clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)

  // Apply common rotations
  earth.rotateY(-0.3)
  clouds.rotateY(-0.3)

  // Add to group
  group.add(earth)
  group.add(clouds)

  animate()
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  controls.update()
  earth.rotateY(0.005 * ROTATION_SPEED)
  clouds.rotateY(0.006 * ROTATION_SPEED)
  renderer.render(scene, camera)
}

const handleResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', handleResize)
  
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.earth-container {
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>

