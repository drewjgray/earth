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
import Ocean from '../assets/Ocean.png'
import NightLights from '../assets/night_lights_modified.png'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import vertexShader from '../shaders/vertex.glsl'
import fragmentShader from '../shaders/fragment.glsl'


// Refs
const container = ref(null)

// Constants (previously controlled by UI)
const SUN_INTENSITY = 4.0
const ROTATION_SPEED = 2.0

// Three.js variables
let scene, camera, dirLight, renderer, clock, controls, earth, clouds, atmosphere, group, composer
let animationFrameId = null
const textureLoader = new THREE.TextureLoader()


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

    composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

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
    const [albedoMap, bumpMap, cloudsMap, oceanMap, lightsMap] = await Promise.all([
        textureLoader.loadAsync(Albedo),
        textureLoader.loadAsync(Bump),
        textureLoader.loadAsync(Clouds),
        textureLoader.loadAsync(Ocean),
        textureLoader.loadAsync(NightLights)
    ])
    albedoMap.colorSpace = THREE.SRGBColorSpace

    // Create geometries
    const sphereGeometry = new THREE.SphereGeometry(10, 64, 64)
    const cloudsGeometry = new THREE.SphereGeometry(10.05, 64, 64)
	const atmosphereGeometry = new THREE.SphereGeometry(12.5, 64, 64)

    // Create materials
    const earthMaterial = new THREE.MeshStandardMaterial({
        map: albedoMap,
        bumpMap: bumpMap,
        bumpScale: 10,
		roughnessMap: oceanMap,
		metalness: 0.1,
		metalnessMap: oceanMap,
		emissiveMap: lightsMap,
		emissive: new THREE.Color(0xffff88),
    })

    earthMaterial.onBeforeCompile = function (shader) {

        shader.uniforms.tClouds = { value: cloudsMap }
        shader.uniforms.tClouds.value.wrapS = THREE.RepeatWrapping;
        shader.uniforms.uv_xOffset = { value: 0 }

        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
            #include <common>
            uniform sampler2D tClouds;
            uniform float uv_xOffset;
        `);

		shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
			float roughnessFactor = roughness;
			#ifdef USE_ROUGHNESSMAP
				vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
				texelRoughness = vec4(1.0) - texelRoughness;
				roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
			#endif
		`);

        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
			#ifdef USE_EMISSIVEMAP
				vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
				emissiveColor *= 1.0 - smoothstep(-0.02, 0.0, dot(normal, directionalLights[0].direction));
				totalEmissiveRadiance *= emissiveColor.rgb;
			#endif
            float cloudsMapValue = texture2D(tClouds, vec2(vMapUv.x - uv_xOffset, vMapUv.y)).r;
            diffuseColor.rgb *= max(1.0 - cloudsMapValue, 0.2 );
            float intensity = 1.4 - dot( normal, vec3( 0.0, 0.0, 1.0 ) );
            vec3 atmosphere = vec3( 0.3, 0.6, 1.0 ) * pow(intensity, 5.0);
            diffuseColor.rgb += atmosphere;
        `)
		

        earthMaterial.userData.shader = shader
    }

    const cloudsMaterial = new THREE.MeshStandardMaterial({
        alphaMap: cloudsMap,
        transparent: true,
		// set opacity to 0.5
		opacity: 0.75,
    })

	const atmosphereMaterial = new THREE.ShaderMaterial({
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		uniforms: {
			atmOpacity: { value: 0.7 },
			atmPowFactor: { value: 4.1 },
			atmMultiplier: { value: 9.5 },
		},
		blending: THREE.AdditiveBlending,
		side: THREE.BackSide,
	})

    // Create meshes
    earth = new THREE.Mesh(sphereGeometry, earthMaterial)
    clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
	atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    // Apply common rotations
    earth.rotateY(-0.3)
    clouds.rotateY(-0.3)

    // Add to group
    group.add(earth)
    group.add(clouds)
	group.add(atmosphere)

    clock = new THREE.Clock()

    animate()
}

const animate = () => {
    animationFrameId = requestAnimationFrame(animate)
    
    const delta = clock.getDelta()

    controls.update()
    earth.rotateY(delta * 0.005 * ROTATION_SPEED)
    clouds.rotateY(delta * 0.01 * ROTATION_SPEED)
    const shader = earth.material.userData.shader
    if (shader) {
        let offset = (delta * 0.005 * ROTATION_SPEED) / (2 * Math.PI)
        shader.uniforms.uv_xOffset.value += offset % 1
    }
    composer.render()
}

const handleResize = () => {
    if (camera && renderer && composer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        composer.setSize(window.innerWidth, window.innerHeight)
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
    if (composer) {
        composer.dispose()
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
