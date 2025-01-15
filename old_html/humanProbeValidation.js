import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

let wireframe;
let plane_x;
let plane_y;
let plane_z;
let VisualizationSphere;
let image;
let mesh;
let currentObject;
let meshes;
let all_stimuli;
let images;

const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();

const maxWidth = 900;
const maxHeight = 800;

// const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 3);

const renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true
});const degreeInRadians = 2 * Math.PI / 360; // one degree in radians

// actually add the rendered scene to the dom
$('#canvas').append(renderer.domElement);

// change some parameters
camera.position.z = 1;
renderer.setSize(
    600, 600
);

// Second canvas for the box visualization
const scene2 = new THREE.Scene();
const camera2 = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 3);
camera2.position.z = 1;
const renderer2 = new THREE.WebGLRenderer();
$('#canvas2').append(renderer2.domElement);
renderer2.setSize(
    200, 200
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//adding light
const ambient = new THREE.AmbientLight(0x404040, 1); // soft white light
scene.add(ambient);

// Add spotlight
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 0, 1);
scene.add(spotLight);

// instantiate a loader
const objectLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();
const base_url = '/static/experiments/current/lightfields/stimuli/'

// make some global for debuggin. 
window.camera = camera;
window.scene = scene
window.renderer = renderer;
window.THREE = THREE;
window.spotLight = spotLight;
window.loader = loader

const json_url = "/static/experiments/current/lightfields/files/meshed_data.json";

let currentImage = 0;
let currentMesh = 0;


let newEnvMap;
let stimuliMaterial;
if (window.condition == '0') {
    stimuliMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF , shininess:30});
} else if (window.condition == '1') {
    stimuliMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
} else if (window.condition == '2') {
    stimuliMaterial = new THREE.MeshToonMaterial({ color: 0xFFFFFF });
} else if (window.condition == '3') {
    console.log("Try to load")

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    console.log('Created this generator thing')

    stimuliMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF , shininess:30});


    new EXRLoader()
        .setDataType(THREE.UnsignedByteType)
        .load(
            "https://threejs.org/examples/textures/piz_compressed.exr",
            function (texture) {
                console.log('Inner loader..')
                exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
                exrBackground = exrCubeRenderTarget.texture;
                newEnvMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;

                // loadObjectAndAndEnvMap(); // Add envmap once the texture has been loaded

                texture.dispose();
            }, function () {
                console.log("Loading complete..")
                stimuliMaterial.envMap = newEnvMap;
                // stimuliMaterial.needsUpdate = true;

                // renderer.toneMapping = THREE.ACESFilmicToneMapping;
                // renderer.outputEncoding = THREE.sRGBEncoding;

                // pmremGenerator.dispose()
            }
        );



}

function set_system(dataList){
    //remove the actual image
    scene.background = '';
    // For each line (participant) in the data
    let counter = 0;
    for (let i=0; i<dataList.length;i++) {
        let data = dataList[i];

        let images = Object.keys(data['payload']);
        // For each image in this participants dataset
        for(let x=0; x<images.length; x++) {
                let image = images[x];
            if (image.includes('.jpg')) {
                // unpack the data
                let d = data['payload'][image] // Get the data for this image/participant
                let mesh = Object.keys(d)      // it's contained within a dictionary with the mesh name
                d = d[mesh]['data']                    // so now access the actual data

                let fileName = 'humanProbe_pps_' + String(i) + "_" + images[x]
                d['fileName'] = fileName;
                d['counter'] = counter;
                
                // download the actual image
                let time = 150 * counter
                setTimeout(set_image, time, d);
                counter++;
                console.log(counter)

            }
        }
    }
}

function set_image(d){

    let fileName = d['fileName']
    console.log(fileName);
    console.log(d['counter'])

    let pos = JSON.parse(d.position);

    // Set the illumination
    spotLight.intensity = Number(d.intensitySpotlight);
    ambient.intensity = Number(d.intensityAmbient);
    spotLight.position.set(pos.x,pos.y, pos.z);
    // download the actual image
    setTimeout(download_image, 50, fileName)

    console.log(pos)
    console.log(spotLight.position);

}

function download_image(fileName){
    var strDownloadMime = "image/octet-stream";
    var strMime = "image/jpeg";
    var imgData = renderer.domElement.toDataURL(strMime);

    var strData = imgData.replace(strMime, strDownloadMime)

    var link = document.createElement('a');
    document.body.appendChild(link); //Firefox requires the link to be in the body
    link.download = fileName;
    link.href = strData;
    link.click();
    document.body.removeChild(link); //remove the link when done


}

window.set_system = set_system;

function load_mesh(object_name) {
    let url = '/static/experiments/current/lightfields/stimuli/'
    currentObject = objectLoader.load(
        // resource URL
        url + object_name,
        // called when resource is loaded
        function (object) {
            let meshData = all_stimuli[image][mesh]

            // get the mesh object
            object = object.children[0]

            // change from volumetric center to bounding box center
            object.geometry.center() // the center does not align with real center

            // the Pose2Mesh does this silly rotation so undo
            object.rotation.x = Math.PI

            // Get the scale the loaded object
            let box = new THREE.Box3().setFromObject(object);
            let mesh_width = box.max.x - box.min.x
            let mesh_height = box.max.y - box.min.y

            // get size of the original input
            let joints_width = meshData.right - meshData.left;
            let joints_height = meshData.bottom - meshData.top;

            // Scale the object 
            object.scale.set(joints_width / mesh_width, joints_height / mesh_height, 1)

            // After scaling, the widt and height changed too. Just get it again to be sure
            box = new THREE.Box3().setFromObject(object);
            mesh_width = box.max.x - box.min.x;
            mesh_height = box.max.y - box.min.y;

            // Set location 
            object.position.x = (mesh_width * 0.5) + meshData.left;
            object.position.y = mesh_height * 0.5 + (1 - meshData.bottom)

            // set material
            object.material = stimuliMaterial;

            scene.add(object);
            window.object = object;

        },
        // called when loading is in progresses
        function () {
            if (window.object) {
                scene.remove(window.object)
                console.log("remove current object..")
            }
        },
        // called when loading has errors
        function (error) {
            console.log('An error happened with loading the mesh');
            console.log(error)
        }
    );
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function create_plane(x, y, z, version, color) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    // const material = new THREE.MeshBasicMaterial( {color: color,  side: THREE.DoubleSide, transparent:true, opacity:0.2});

    const material = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide,
        shadowSide: THREE.DoubleSide
    });

    const plane = new THREE.Mesh(geometry, material);

    if (version == 'x') {
        plane.rotation.y = degreeInRadians * 90
        plane.position.x = x / 10;
        wireframe.remove(plane_x);
        plane_x = plane;
    } else if (version == 'y') {
        plane.rotation.x = degreeInRadians * 90
        plane.position.y = y / 10;
        wireframe.remove(plane_y);
        plane_y = plane;
    } else if (version == 'z') {
        plane.position.z = z / 10;
        wireframe.remove(plane_z);
        plane_z = plane;
    }
    wireframe.add(plane);
}

function backBtn() {

    currentMesh = currentMesh - 1;
    if (currentMesh < 0) {
        currentMesh = 0;
        currentImage = currentImage - 1;
        if (currentImage < 0) {
            currentImage = 0;
        }
    }

    if ((currentMesh == currentImage) && (currentMesh == 0 )) {
        $('#back').addClass('disabled-btn')
    }

    initialize_trial()
}

function nextBtn() {
    $('#back').removeClass('disabled-btn')

    let date = new Date();

    let trialData = {
        'trial': mesh,  // duplicate data but might be easier at a later stage
        'image': image, // duplicate data but might be easier at a later stage
        'position': JSON.stringify(spotLight.position),
        // 'scale': JSON.stringify(spotLight.scale),
        // 'rotation': JSON.stringify(spotLight.rotation),
        'intensitySpotlight': JSON.stringify(spotLight.intensity),
        'intensityAmbient': JSON.stringify(ambient.intensity),
        'time' : date.getTime() - all_stimuli[image][mesh]['startTime'],
        // 'penumbra': JSON.stringify(spotLight.penumbra),
        // 'angle': JSON.stringify(spotLight.angle),
        // 'sliderX': $("#sliderX").slider('value'), 
        // 'sliderY': $("#sliderY").slider('value'), 
        // 'sliderZ': $("#sliderZ").slider('value'), 
        // 'sliderIntensitySpotlight' : $('#sliderIntensitySpotlight').slider('value'),
        // 'sliderIntensityAmbient'   : $('#sliderIntensityAmbient').slider('value')

    }
    console.log(trialData)
    all_stimuli[image][mesh]['data'] = trialData


    // then progress to the next trial
    currentMesh = currentMesh + 1;

    if (currentMesh == meshes.length) {
        // this is the last mesh of this image, so continue with the next image
        currentImage = currentImage + 1
        currentMesh = 0;
        console.log("Next image..")
    } 
    if (currentImage == images.length) {
        // this is the last image, so submit data
        $('#finished').removeClass('hidden')
        $('#content').addClass('hidden')
        return
    }

    initialize_trial()

}

function load_image(image) {
    let imageTexture = textureLoader.load(base_url + image,
        function (image) {
            let img = image.image;

            let w = img.width;
            let h = img.height;


            if (w > maxWidth) {
                let ratio = maxWidth / w;
                w = maxWidth;
                h = h * ratio;
            }
            if (h > maxHeight) {
                let ratio = maxHeight / h;
                h = maxHeight
                w = w * ratio
            }

            // aspect_ratio = w / h;
            renderer.setSize(w, h)


            window.texture = imageTexture;
            scene.background = imageTexture
        },
        // called when loading is in progresses
        function () { },
        // called when loading has errors
        function (error) {
            console.log('An error happened with loading the image');
            console.log(error)
        }

    )
}

function initialize_trial() {
    // update global variables and load/present the image/mesh
    console.log("Next trial..")
    image = images[currentImage]

    // Get the next mesh
    mesh = Object.keys(all_stimuli[image])[currentMesh]
    window.all_stimuli = all_stimuli;

    let date = new Date();
    console.log(all_stimuli);
    console.log(image);
    console.log(currentMesh);
    console.log(mesh);

    all_stimuli[image][mesh]['startTime'] = date.getTime();
    
    if (all_stimuli[image][mesh]['data']) {
        let data = all_stimuli[image][mesh]['data']
        console.log(data)
        let pos = JSON.parse(data['position'])
        // Put the values back that the user input
        $('#sliderX').slider("value", pos.x)
        $('#sliderY').slider("value", pos.y)
        $('#sliderZ').slider("value", pos.z)
        $('#sliderIntensitySpotlight').slider("value", Number(data['intensitySpotlight']))
        $('#sliderIntensityAmbient').slider("value", Number(data['intensityAmbient']))
        // Reset light
        spotLight.intensity = Number(data['intensitySpotlight']);
        ambient.intensity = Number(data['intensityAmbient']);
        spotLight.position.set(pos.x,pos.y, pos.z);
    } else {
        // Reset slider values
        $('.ui-slider').each(function(){
            var options = $(this).slider( 'option' );
            var mean = (options.max + options.min) / 2
            $(this).slider("value", mean)
        });
        // Reset light
        spotLight.intensity = 1;
        ambient.intensity = 1;
        spotLight.position.set(0,0,1);
    }


    // Set next image
    load_image(image)

    // set the next mesh
    load_mesh(mesh)

    // Set the text 
    meshes = Object.keys(all_stimuli[image])
    $('#imageNumber').text(currentImage + 1)
    $('#imagesN').text(images.length)
    $('#meshNumber').text(currentMesh + 1)
    $('#meshesN').text(meshes.length)
}

function create_cube_visualization() {

    function set_view_point(obj) {
        // set a nice visual angle
        obj.rotation.set(0.2, -0.2, -0.1) // magic values based on trial&error observation
        obj.position.set(.5, 0.5, 0)
        obj.scale.set(0.7, 0.7, 0.7)
    }


    // Create the cube that illustrates the current light position to the user
    const cubeGeom = new THREE.BoxGeometry(1, 1, 1)

    // For the cube, also illustrate the edges to give it a little more depth
    const _wireframe = new THREE.EdgesGeometry(cubeGeom);
    wireframe = new THREE.LineSegments(_wireframe); // turn the edges into lines

    // set_view_point(cube);
    set_view_point(wireframe);

    scene2.add(wireframe);

    VisualizationSphere = new THREE.Mesh(new THREE.SphereGeometry(0.03), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    wireframe.add(VisualizationSphere);

    // const cube = new THREE.Mesh( cubeGeom );
    // scene.add(cube)

    // Initialize the 3 center planes
    create_plane(0, 0, 0, 'x', 0xF63D15)
    create_plane(0, 0, 0, 'y', 0x15F63D)
    create_plane(0, 0, 0, 'z', 0x3D15F6)

    window.wireframe = wireframe; // debug
}

function moveAxis(step, version) {
    // All axis needs to be updated
    let pos = window.spotLight.position;
    let x, y, z;

    // New values based on step
    x = Math.min(pos.x + step, 100); // TOOD min max value don't reflect current slider
    y = Math.min(pos.y + step, 100);
    z = Math.min(pos.z + step, 100);

    if (version == 'x') {
        plane_x.position.x = x / 10;
        VisualizationSphere.position.x = x / 10;
        spotLight.position.set(x, pos.y, pos.z);

    } else if (version == 'y') {
        plane_y.position.y = y / 10;
        VisualizationSphere.position.y = y / 10;
        spotLight.position.set(pos.x, y, pos.z);

    } else if (version == 'z') {
        plane_z.position.z = z / 10;
        VisualizationSphere.position.z = z / 10;
        spotLight.position.set(pos.x, pos.y, z);

    }

}

function animate() {
    requestAnimationFrame(animate);

    renderer.sortObjects = false
    renderer.render(scene, camera);

    renderer2.render(scene2, camera2);

}

$(function () {
    function initialize_sliders() {
        // wrapped in a function just so it minimized in VSC
        $("#sliderX").slider({
            min: -5,
            max: 5,
            start: 5,
            step: 0.2,
            start: function (event, ui) {
                window.startValue = ui.value
            }, slide: function (event, ui) {
                let difference = ui.value - window.startValue;
                window.startValue = ui.value;
                moveAxis(difference, 'x')
            }
        });
        $("#sliderY").slider({
            min: -5,
            max: 5,
            step: 0.2,
            start: function (event, ui) {
                window.startValue = ui.value
            }, slide: function (event, ui) {
                let difference = ui.value - window.startValue;
                window.startValue = ui.value;
                moveAxis(difference, 'y')
            }
        });
        $("#sliderZ").slider({
            min: -5,
            max: 5,
            step: 0.2,
            start: function (event, ui) {
                window.startValue = ui.value
            }, slide: function (event, ui) {
                let difference = ui.value - window.startValue;
                window.startValue = ui.value;
                moveAxis(difference, 'z')
            }
        });
        $('#sliderLightRadius').slider({
            min: 0,
            max: Math.PI / 2,
            value: Math.PI / 2, // Set to max so it initalized in a plausible way
            step: Math.PI / 2 / 100, // max value / 100
            create: function (event, ui) {
                let val = Math.PI / 4 / (Math.PI / 2) * 40;
                $('#slider_1_radius').attr('r', val)
                spotLight.angle = Math.PI / 4;
            },
            slide: function (event, ui) {
                $('#slider_1_radius').attr('r', ui.value / (Math.PI / 2) * 40)
                spotLight.angle = ui.value;
            }
        });
        $('#sliderLightRadiusPenumbra').slider({
            min: 0,
            max: 1,
            value: .5, // middle
            step: 0.01, // max value / 100
            slide: function (event, ui) {
                $('#penumbra').attr('stdDeviation', ui.value * 5)
                spotLight.penumbra = ui.value;
            }
        });
        $('#sliderIntensitySpotlight').slider({
            min: 0,
            max: 2,
            value: 1,
            step: 0.05,
            slide: function (event, ui) {
                spotLight.intensity = ui.value;
            }
        });
        $('#sliderIntensityAmbient').slider({
            min: 0,
            max: 2,
            value: 1,
            step: 0.05,
            slide: function (event, ui) {
                ambient.intensity = ui.value;
            }
        });
        // add buttons, too
        $("#back, #next").button();
        $('#back').click(function () { backBtn(); })
        $('#next').click(function () { nextBtn(); })

        $('#submit_data').click(function () { 
            all_stimuli['feedback'] = $('#feedbackText').val();
            window.submit_data(all_stimuli) }
        )
    }


    initialize_sliders();

    create_cube_visualization();

    animate();

    async function getJson(url) {
        let response = await fetch(url);
        let data = await response.json()
        // window.all_stimuli = data;
        all_stimuli = data;
        images = Object.keys(all_stimuli)

        initialize_trial()
    }

    getJson(json_url)

});

function toggle_instruction(page){
    $('.instruction_page').addClass('hidden'); // hide everythithing
    $(`#${page}`).removeClass('hidden') // and show the target page again
    document.getElementById(page).scrollIntoView();
}
window.toggle_instruction = toggle_instruction

