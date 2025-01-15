let curRating;
let curID;

curID = 99999;
const base_url = '/static/experiments/current/nikola_sad/stimuli/sadness_selected_imgonly100/' // TODO modify here every emotion
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
    images = ['sa_420.png', 'sa_28.png', 'sa_153.png', 'sa_245.png', 'sa_128.png', 'sa_34.png', 'sa_204.png', 'sa_237.png', 'sa_288.png', 'sa_207.png', 'sa_142.png', 'sa_443.png', 'sa_290.png', 'sa_58.png', 'sa_84.png', 'sa_379.png', 'sa_95.png', 'sa_8.png', 'sa_247.png', 'sa_146.png', 'sa_89.png', 'sa_457.png', 'sa_6.png', 'sa_42.png', 'sa_497.png', 'sa_144.png', 'sa_1.png', 'sa_77.png', 'sa_298.png', 'sa_390.png', 'sa_381.png', 'sa_46.png', 'sa_339.png', 'sa_236.png', 'sa_2.png', 'sa_165.png', 'sa_111.png', 'sa_158.png', 'sa_147.png', 'sa_496.png', 'sa_123.png', 'sa_265.png', 'sa_274.png', 'sa_174.png', 'sa_169.png', 'sa_269.png', 'sa_16.png', 'sa_452.png', 'sa_211.png', 'sa_280.png', 'sa_209.png', 'sa_7.png', 'sa_35.png', 'sa_279.png', 'sa_402.png', 'sa_3.png', 'sa_491.png', 'sa_300.png', 'sa_161.png', 'sa_43.png', 'sa_59.png', 'sa_451.png', 'sa_254.png', 'sa_168.png', 'sa_234.png', 'sa_260.png', 'sa_140.png', 'sa_124.png', 'sa_307.png', 'sa_483.png', 'sa_226.png', 'sa_107.png', 'sa_345.png', 'sa_422.png', 'sa_474.png', 'sa_212.png', 'sa_151.png', 'sa_261.png', 'sa_166.png', 'sa_351.png', 'sa_241.png', 'sa_499.png', 'sa_329.png', 'sa_263.png', 'sa_481.png', 'sa_253.png', 'sa_376.png', 'sa_387.png', 'sa_354.png', 'sa_368.png', 'sa_313.png', 'sa_463.png', 'sa_271.png', 'sa_120.png', 'sa_442.png', 'sa_328.png', 'sa_407.png', 'sa_286.png', 'sa_26.png', 'sa_436.png', 'sa_143.png', 'sa_364.png']

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