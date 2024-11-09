<template>
  <div ref="container" class="earth-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import albedoTexture from '../assets/Albedo.jpg'

const textureLoader = new THREE.TextureLoader()

// Refs
const container = ref(null)

// Constants (previously controlled by UI)
const SUN_INTENSITY = 2.8
const ROTATION_SPEED = 0.2

// Three.js variables
let scene, camera, renderer, controls, earth, dirLight, earthGroup
let animationFrameId = null

const initScene = async () => {
  scene = new THREE.Scene()

  const albedoMap = await textureLoader.loadAsync(albedoTexture)
  albedoMap.colorSpace = THREE.SRGBColorSpace

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

  earthGroup = new THREE.Group()
  earthGroup.rotation.z = (23.5 / 360) * 2 * Math.PI

  const earthGeometry = new THREE.SphereGeometry(10, 64, 64)
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: albedoMap,
  })
  earth = new THREE.Mesh(earthGeometry, earthMaterial)
  earthGroup.add(earth)
  earth.rotateY(-0.3)

  scene.add(earthGroup)

  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  animate()
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  controls.update()
  earth.rotateY(0.005 * ROTATION_SPEED)
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

