let curRating;
let curID;

curID = 99999;
const base_url = '/static/experiments/current/nikola_surprise/stimuli/surprise_selected_imgonly100/' // TODO modify here every emotion
var experimentCount = 0;
const expIterval = 50;

// Add your own javacript functions here. 
function toggle_instruction(page){
    $('.instruction_page').addClass('hidden'); // hide everythithing
    $(`#${page}`).removeClass('hidden') // and show the target page again
    document.getElementById(page).scrollIntoView();
};
window.toggle_instruction = toggle_instruction;

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    var uuidField = document.getElementById("uuid");
    uuidField.value = uuid;

    console.log(uuid);
    return uuid;
  }

function getCurrentID() {
    const IDTextBox = document.getElementById('uuid');
    if(IDTextBox.value !== null && IDTextBox.value !== '') {
        curID = IDTextBox.value;
    }
    return curID
}

function showID() {
    const idp = document.getElementById('showID')
    idp.innerText = getCurrentID()
}

function showResult() {
	get_current_rating();

    curResult = document.getElementById("curResult");
    curResult.innerText = curRating ? `You selected ${curRating}` : `You haven't selected any rating`;
};

// $("#button1").click(function () {
//     $("#partcipant_id").val("red"); // テキストボックスに値を設定
//   });

let part_consent = false;

function submitForm() {
    // Get the form data
    const form = document.getElementById("my-form");

    // Check if the checkbox is checked
    const checkbox = form.querySelector('input[name="consent"]');
    if (!checkbox.checked) {
      document.getElementById("error-message").textContent = "You must check the box to continue.";
      return;
    }
    part_consent = checkbox.checked;
    console.log(part_consent);
    window.toggle_instruction('id_page'); 
    generateUUID();
}

function checkInfo() {
    participant_id = document.getElementById("participant_id").value;
    if (!participant_id) {  // if participant_id is empty
        document.getElementById("error-message-info").textContent = "You must enter your participant ID to continue.";
        return;
    }

    age_num = document.getElementById("age").value;
    if (!age_num) {  // if age is empty
        document.getElementById("error-message-info").textContent = "You must enter your age to continue.";
        return;
    }

    // finish checking, go to practice page
    window.toggle_instruction('practice_page'); 
    practiceTest();
}


function cleanRadioBtn() {
	$(`input[name="rating"]`).prop("checked", false);
    document.getElementById("curResult").innerText = ""
};
window.cleanRadioBtn = cleanRadioBtn;

// -----------------
// Experiment
// Define a function to compare two images and ask the user to choose
// The compareImages function returns a promise that resolves to 
// either -1 if the user thinks the left image is greater
// or 1 if the user thinks the right image is greater.
async function compareImages(img1, img2, pairs, containerName) {
    // Hide all other images while the comparison is being made
    var images = document.querySelectorAll(`#${containerName} img`);
    let numberElement;
    if (document.getElementById('experiment_page').classList.contains('hidden')) {
        numberElement = document.getElementById('experimentCounter_practice');
    } else {
        numberElement = document.getElementById('experimentCounter_rating');
    }

    images.forEach(img => {
        if (img !== img1 && img !== img2) {
            img.classList.add('hidden');
        }
    });

    return new Promise(resolve => {
        // define two inner function
        // Attach keydown handler to document to get user input
        function selectImage(selectedImg, otherImg, result) {
            // Remove the comparison div
            let checkcomparisonDiv = document.getElementById('comparisonDiv');
            if (checkcomparisonDiv) {
                console.log('comparisonDiv exists');
                checkcomparisonDiv.remove();
            }
  
            // Restore all hidden images
            images.forEach(img => img.classList.remove('hidden'));
  
            pairs.push([selectedImg.id, otherImg.id, result]);
            
            // add 1 to counter
            experimentCount++;
            numberElement.textContent = experimentCount;

            // destroy event listener once we have a response
            document.removeEventListener("keydown", handleKeydown)
        }
  
        function handleKeydown(event) {
            if (reverseFlag) {
                if (event.key === "q") { // Q for selecting img2
                    console.log(event.key);
                    selectImage(img2, img1, -1);
                    resolve(1);
                } else if (event.key === "p") { // P for selecting img1
                    console.log(event.key);
                    selectImage(img2, img1, 1);
                    resolve(-1);
                }
            } else {
                if (event.key === "q") { // Q for selecting img1
                    console.log(event.key);
                    selectImage(img1, img2, -1);
                    resolve(-1);
                } else if (event.key === "p") { // P for selecting img2
                    console.log(event.key);
                    selectImage(img1, img2, 1);
                    resolve(1);
                }
            }
        }

        // here is the main part
        // Create a new div to show the two images
        const comparisonDiv = document.createElement('div');
        comparisonDiv.style.display = 'flex'; // add this line to make the images display side-by-side
        comparisonDiv.style.justifyContent = 'center'; // add this line to center the images
        comparisonDiv.style.alignItems = 'center'; // add this line to center the images
        comparisonDiv.style.marginBottom = '20px'; // add some margin to the bottom of the div
        comparisonDiv.id = 'comparisonDiv';
        img1.style.marginLeft = '20px'; // add some margin to the left of img1
        img1.style.marginRight = '20px'; // add some margin to the right of img1
        img2.style.marginLeft = '20px'; // add some margin to the left of img2
        img2.style.marginRight = '20px'; // add some margin to the right of img2
        // add the sleeping time before showing the image

        if (document.getElementById('experiment_page').classList.contains('hidden')) {
            img1.classList.add('practice-image');
            img2.classList.add('practice-image');
        } else {
            img1.classList.add('image');
            img2.classList.add('image');
        }
        // Randomly decide which image should be on the left and which should be on the right
        reverseFlag = false;
        if (Math.random() < 0.5) {
            reverseFlag = true;
        }
        if (reverseFlag) {
            comparisonDiv.appendChild(img2);
            comparisonDiv.appendChild(img1);
        } else {
            comparisonDiv.appendChild(img1);
            comparisonDiv.appendChild(img2);
        }
        document.body.appendChild(comparisonDiv);

        // Attach click handlers to the images to get user input
        if (reverseFlag) {
            // If the images were reversed, then the user should click img2 if they think left image is greater
            img1.onclick = () => {
                console.log('img1 clicked');
                selectImage(img2, img1, 1)
                resolve(-1);
            };
            img2.onclick = () => {
                console.log('img2 clicked');
                selectImage(img2, img1, -1)
                resolve(1);
            };
        } else {
            img1.onclick = () => {
                console.log('img1 clicked');
                selectImage(img1, img2, -1)
                resolve(-1);
            };
            img2.onclick = () => {
                console.log('img2 clicked');
                selectImage(img1, img2, 1)
                resolve(1);
            };
        }

        // Attach keydown handler to document to get user input
        document.addEventListener("keydown", handleKeydown, {once: true});

    });
}

// Define a function to sort an array of images
async function mergeSort(images, containerName) {
    const pairs = [];
    var sortedImages = await mergeSortRecursive(images, pairs, containerName);
    return { images, pairs, sortedImages};
}
  
async function mergeSortRecursive(images, pairs, containerName) {
    // Base case: if there is only one image, return it
    if (images.length <= 1) {
        return images;
    }

    // Recursive case: divide the array into two sub-arrays
    const mid = Math.floor(images.length / 2);
    const left = images.slice(0, mid);
    const right = images.slice(mid);

    // Recursively sort the left and right sub-arrays
    const sortedLeft = await mergeSortRecursive(left, pairs, containerName);
    const sortedRight = await mergeSortRecursive(right, pairs, containerName);

    // Merge the sorted sub-arrays together
    const merged = [];
    let i = 0, j = 0;
    while (i < sortedLeft.length && j < sortedRight.length) {
        // set the interval between each comparison
        await new Promise(r => setTimeout(r, expIterval));
        const cmp = await compareImages(sortedLeft[i], sortedRight[j], pairs, containerName);
        if (cmp === 1) {
        merged.push(sortedRight[j++]);
        } else {
        merged.push(sortedLeft[i++]);
        }
    }
    while (i < sortedLeft.length) {
        merged.push(sortedLeft[i++]);
    }
    while (j < sortedRight.length) {
        merged.push(sortedRight[j++]);
    }
    return merged;
}
var practice_res = [];

function practiceTest() {
    // initialize the counter
    experimentCount = 0;
    practice_res = [];

    mergeSort(Array.from(document.querySelectorAll('#practice-image-container img')), 'practice-image-container')
        .then(result => {
            console.log('Pairwise comparisons:');
            result.pairs.forEach(pair => {
                console.log(`${pair[0]} vs. ${pair[1]}: ${pair[2]}`);
                practice_res.push(pair);
            });
            // show the button
            document.getElementById("practice_success").style.display = "block";

            // Show the sorted images
            const sortedContainer = document.createElement('div');
            sortedContainer.id = 'practice-sorted-container';
            sortedContainer.classList.add('practice-sorted-container');
            sortedImgList = result.sortedImages;

            var practice_flag = false;
            const correct_ans = ['image_num_7', 'image_num_1', 'image_num_5', 'image_num_3', 'image_num_9']
            for (let i = 0; i < 5 ; i++) {
                if (sortedImgList[i] != correct_ans[i]) {
                    practice_flag = true;
                    break
                }
            }
            if (practice_flag == true) {
                practice_res = 'true'
            } else {
                practice_res = sortedImgList.map(function(image) {
                    return image.id;
                });
            }

            // Show the accending order of the images
            result.sortedImages.reverse().forEach(img => {
                img.onclick = null;
                img.cursor = 'none';
                img.classList.add('practice-sorted-container');
                img.classList.add('image');
                
                sortedContainer.appendChild(img);
            });
            document.body.appendChild(sortedContainer);
    });
}

function destroyPractice() {
    // destroy the practice
    document.getElementById("practice-image-container").innerHTML = '';
    document.getElementById("practice-sorted-container").innerHTML = '';
    document.getElementById("practice_success").style.display = "none";
}

function shuffleArray(array) {
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

var finalResult = [];
// store the sorted list of images from rank 1 to the last
var sortedImgList = [];

function startExperiment() {
    // initialize the counter
    finalResult = [];
    sortedImgList = [];
    experimentCount = 0;
    // load the images
    var imageContainer = document.getElementById("experiment-image-container");
    // clear the container
    imageContainer.innerHTML = '';

    var images = [];


    // // generate image names dynamically
    // for (var i = 1; i <= 100; i++) {
    //     images.push(base_url + "image_" + i + ".png"); // TODO change the image name
    // }

    // current image index
    // TODO change image for every set of exp
    images = ['su_303.png', 'su_236.png', 'su_274.png', 'su_250.png', 'su_351.png', 'su_337.png', 'su_483.png', 'su_174.png', 'su_385.png', 'su_300.png', 'su_26.png', 'su_261.png', 'su_110.png', 'su_339.png', 'su_97.png', 'su_271.png', 'su_490.png', 'su_328.png', 'su_208.png', 'su_457.png', 'su_190.png', 'su_302.png', 'su_2.png', 'su_369.png', 'su_38.png', 'su_237.png', 'su_290.png', 'su_3.png', 'su_477.png', 'su_159.png', 'su_433.png', 'su_228.png', 'su_263.png', 'su_119.png', 'su_128.png', 'su_34.png', 'su_333.png', 'su_380.png', 'su_467.png', 'su_91.png', 'su_362.png', 'su_143.png', 'su_212.png', 'su_435.png', 'su_317.png', 'su_161.png', 'su_292.png', 'su_245.png', 'su_204.png', 'su_428.png', 'su_66.png', 'su_89.png', 'su_104.png', 'su_451.png', 'su_479.png', 'su_345.png', 'su_211.png', 'su_376.png', 'su_80.png', 'su_413.png', 'su_426.png', 'su_106.png', 'su_322.png', 'su_366.png', 'su_95.png', 'su_364.png', 'su_307.png', 'su_398.png', 'su_197.png', 'su_215.png', 'su_491.png', 'su_115.png', 'su_120.png', 'su_427.png', 'su_81.png', 'su_397.png', 'su_85.png', 'su_279.png', 'su_475.png', 'su_8.png', 'su_423.png', 'su_358.png', 'su_153.png', 'su_494.png', 'su_402.png', 'su_105.png', 'su_121.png', 'su_350.png', 'su_440.png', 'su_182.png', 'su_275.png', 'su_371.png', 'su_166.png', 'su_46.png', 'su_407.png', 'su_239.png', 'su_248.png', 'su_396.png', 'su_42.png', 'su_441.png', 'su_131.png', 'su_474.png']
    
    // DEBUG
    // images = images.slice(0, 5);

    var shuffledImages = shuffleArray(images);

    for (var i = 0; i < shuffledImages.length; i++) {
        var img = document.createElement("img");
        img.src = base_url + shuffledImages[i];
        img.id = img.src.slice(6).slice(0, -4);
        img.width = 224;
        imageContainer.appendChild(img);
    }

    // Sort the images and display the results
    mergeSort(Array.from(document.querySelectorAll('#experiment-image-container img')), 'experiment-image-container')
        .then(result => {

        // get sorted img list
        sortedImgList = result.sortedImages;

        // Show the "experiment finished" message
        const finishMessage = document.createElement('h2');
        finishMessage.textContent = "Experiment finished. Please click the Submit button to submit the data. If you don't want to submit your data, just close this site. Thank you!";
        document.body.appendChild(finishMessage);

        // show the button
        document.getElementById("experiment_success").style.display = "block";

        // Display the pairwise comparisons made by the user
        console.log('Pairwise comparisons:');
        result.pairs.forEach(pair => {
            console.log(`${pair[0]} vs. ${pair[1]}: ${pair[2]}`);
            finalResult.push(pair);
        });
        
        // submit the data
        my_submit(); 
    });
}

function showExpResult() {
    // Show the sorted images
    const sortedContainer = document.createElement('div');
    sortedContainer.classList.add('practice-sorted-container');

    // Show the decending order of the images
    sortedImgList.forEach(img => {
        img.onclick = null;
        img.cursor = 'default';
        
        sortedContainer.appendChild(img);
    });
    document.body.appendChild(sortedContainer);
}

function get_my_result() {
    var age = document.getElementById("age").value;
    var area = document.getElementById("area").value;
    var participant_id = document.getElementById("participant_id").value;
    var sortedList = sortedImgList.map(x => x.id.slice(91)+'.png')
    var pairCompCounter = document.getElementById("experimentCounter_rating").textContent
    result = {
        'participant_id' : participant_id,
        'ID' : curID,
        'age' : age,
        'area' : area,
        'practice_res' : practice_res,
        'pairwise_rating' : finalResult,
        'sortedlist' : sortedList,
        'pairCompCounter' : pairCompCounter,
    }
    console.log("result is ", result)
    return result;
}

function my_submit() {
    curID = getCurrentID();
    var result = get_my_result()
	submit_data(result)
};

function submit_data(data) {
    let date = new Date();

    req = $.ajax({
        type: "POST",
        url: window.url + "data_submission",
        data: {
            'data': JSON.stringify({
                // Data on the user/machine
                'userData': {
                    'size': window._size,
                    'screen': window._screen,
                    'navigator': window._navigator,
                },
                // These three are set in the experiment_wrapper.html 
                'experiment_name': window.experiment_name,
                'experiment_instance': window.experiment_instance,
                'condition': window.condition,

                'worker_id': window.worker_id,

                // PROLIFIC - Automatically skipped if it does not exist.
                'sessionId' : window.SESSION_ID, 
                'HITd' : window.STUDY_ID,

                // MTURK - Automatically skipped if it does not exist.
                'assignmentId': window.assignmentID,
                'HITid': window.HITid,
                // the actual data
                'payload': data,
                'totalTime' : date.getTime() - window._startTime,
            })
        }
    })
    req.done(function (response) {
        console.log("Data submitted succesfully")
        if (window.platform === 'AMT') {
            // we are running an MTURK experiment, finish it as such
            $('#assignmentId').val(window.assignmentID);
            $('#submitButtonAMT').click(); // auto click the mturk submit button.
        } else if (window.platform === 'PROLIFIC') {
            // we are running an Prolofic experiment. 
            window.location.href = window.PROLIFIC_SUBMISSION_URL;
        } else if (window.platform === 'LOCAL') {
            // Seems like we're running without a reward platform so we're basically finished..
        }
    });

    req.fail(function (response) {
        console.log("Something has gone wrong..")
        console.log(response)
        window.resp = response;
    }
    );
}