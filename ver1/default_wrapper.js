initialize();
function initialize() {
    console.log('Initialization of updated experiment wrapper')

    // if (window.hasOwnProperty('psychoJS')) {
    //     jQuery("#progressbar").progressbar();
    // }

    determinePlatform();
    get_info()

    getWorkerId()

    window.url = 'https://labexperiment.cog.ist.i.kyoto-u.ac.jp/'
    window.submit_data = submit_data// if it's not accessible 

    workerDoneBefore() // make an async call. Will call start() once finished
}

function get_info() {
    let date = new Date();
    // get some basic info on the worker - if any of this is not available that's fine
    window._screen = {
        'availHeight': screen.availHeight,
        'availLeft': screen.availLeft,
        'availTop': screen.availTop,
        'availWidth': screen.availWidth,
        'colorDepth': screen.colorDepth,
        'height': screen.height,
        'pixelDepth': screen.pixelDepth,
        'width': screen.width,
        // 'orientation': screen.orientation.type
    }
    window._navigator = {
        'appVersion': navigator.appVersion,
        'language': navigator.language,
        'platform': navigator.platform,
        'userAgent': navigator.userAgent,
        'vendor': navigator.vendor,
    }
    window._size = {
        'w': innerWidth,
        'h': innerHeight
    }
    window._startTime = date.getTime();
}

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

function overWriteSave() {
    if (window.psychoJS.hasOwnProperty('_experiment')) {
        window.psychoJS._experiment.save = function () {
            console.log('overwrite save..')
            let data = generateCSVFromData();
            submit_data(data);}
        console.log("Save has been replaced.")
    }  else {
        setTimeout(overWriteSave, 100)
        console.log("Try that again..")
    }
}


function skipDialougeBox() {
    if ($('#expDialog').children().length > 2) {
        console.log("try the clicky thing")
        $('#buttonOk').click();
    } else {
        setTimeout(skipDialougeBox, 100)
        console.log("Try skipping that box again..") 
    }
}

function start() {
    if (isTurkPreview()) {
        show('preview_wrapper');
        return
    }

    if (window.hasOwnProperty('psychoJS')) {
        // Only if we are actually using psychoJS will this be attached.
        overWriteSave()
        skipDialougeBox();
    }

    if ($('.tutorial').length) {
        // If there is a tutorial. Display this first. In this case, the tutorial should called show('content_wrapper');
        show('tutorial_wrapper');
    } else {
        show('content_wrapper');
    }

}

function show(element) {
    // hide all elements
    $('main_element.show').removeClass('show').addClass('hidden');
    // switch the css display property of the provided element
    var ele = $(`#${element}`);
    ele.removeClass('hidden').addClass('show');
}



// Functions needed when using PSYCHOJS
const xlsx = require("xlsx")
console.log("If there was an error saying require was not defined, we can safely ignore it.")

function getLoopAttributes(loop) {
    let properties = ["thisRepN", "thisTrialN", "thisN", "thisIndex", "stepSizeCurrent", "ran", "order"]
    let attributes = {}
    let loopName = loop.name;
    for (let loopProperty in loop)
        if (properties.includes(loopProperty)) {
            let key = loopProperty === "stepSizeCurrent" ? loopName + ".stepSize" : loopName + "." + loopProperty;
            attributes[key] = loop[loopProperty]
        }
    if (typeof loop.getCurrentTrial == "function") {
        let currentTrial = loop.getCurrentTrial();
        for (let trialProperty in currentTrial)
            attributes[trialProperty] = currentTrial[trialProperty]
    }
    return attributes
}


function generateCSVFromData() {

    attributes = window.psychoJS._experiment._trialsKeys.slice();

    for (let l = 0; l < window.psychoJS._experiment._loops.length; l++) {
        let loop = window.psychoJS._experiment._loops[l]
        loopAttributes = getLoopAttributes(loop);
        for (let a in loopAttributes)
            loopAttributes.hasOwnProperty(a) && attributes.push(a)
    }
    for (let a in window.psychoJS._experiment.extraInfo)
        window.psychoJS._experiment.extraInfo.hasOwnProperty(a) && attributes.push(a)

    let worksheet = xlsx.utils.json_to_sheet(window.psychoJS._experiment._trialsData)
    return "\uFEFF" + xlsx.utils.sheet_to_csv(worksheet)

}

function workerDoneBefore() {
    if (window.sandbox) {
        start();
        return
    }
    if (window.platform != 'LOCAL') {
        start();
        return
    }

    // Either on PROLIFIC or on AMT
    req = $.ajax({
        method: "GET",
        url: window.url + "workerCheck",
        data: {
            'worker_id': window.worker_id,
            'experiment_name': window.experiment_name,
            'platform': window.platform,
        }
    })

    req.done(function (response) {
        if (response == 'Found') {
            console.log("Worker already done. Block")
            show('already_done_wrapper')
            return
        } 
    });

} 
    



function getParameterFromHREF(name, defaultValue) {
    // create and execute a regex to extract the value
    var regex = new RegExp("[\?&]" + name + "=([^&#]*)");
    var results = regex.exec(window.location.href);
    if (results == null) {
        return defaultValue;
    } 
    return results[1];
}

function getWorkerId() {

    if (window.platform == 'AMT') {
        // get the AMT worker id. 
        worker_id = getParameterFromHREF(
            'worker_id',
            'COULD_NOT_EXTRACT_AMT_ID'
        );
        window.assignmentID = getParameterFromHREF('assignmentId', '');
        window.HITid = getParameterFromHREF('hitId', '')
    } else if (window.platform == 'PROLIFIC') {
        // get from url
        worker_id = getParameterFromHREF(
            'PROLIFIC_PID',
            'COULD_NOT_EXTRACT_PROLIFIC_ID'
        );    
        window.SESSION_ID = getParameterFromHREF('SESSION_ID', '');
        window.STUDY_ID = getParameterFromHREF('STUDY_ID', '')
    } else {
        worker_id = 'NO_WORKER_ID_WHEN_RUNNING_LOCAL'
    }

    window.worker_id = worker_id;
}

function isTurkPreview() {
    return (window.worker_id == "COULD_NOT_EXTRACT_AMT_ID" && window.platform == 'AMT');
}

function determinePlatform() {
    if (window.location.host.indexOf('mturk') != -1 || window.parent.location.host.indexOf("mturk") != -1) {
        window.platform = 'AMT'
    } else if (window.location.href.indexOf('PROLIFIC_PID') != -1 || window.parent.location.href.indexOf("STUDY_ID") != -1) {
        // Prolific doesn't host, so must check href instead of host
        window.platform = 'PROLIFIC';
    } else {
        window.platform = 'LOCAL';
    }
}




