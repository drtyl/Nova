/* Dış kütüphaneleri yükleyip sıradaki dosyaların kullanabilmesi için globale açar. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { VRMLoaderPlugin, VRMUtils, VRMHumanoid } from '@pixiv/three-vrm';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
Object.assign(globalThis, { EffectComposer, RenderPass, GTAOPass, OutputPass, RoomEnvironment, THREE, GLTFLoader, OrbitControls, RoundedBoxGeometry, VRMLoaderPlugin, VRMUtils, VRMHumanoid });
