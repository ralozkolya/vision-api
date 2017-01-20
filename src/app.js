$(function () {
    "use strict";

    /**
     * Vision API key
     * Replace with your own
     * */
    var key = "AIzaSyACeyKJMbP_UjY3f0NexgRj97pPLGVEa8A";

    /**
     * Vision API URL
     * */
    var url = "https://vision.googleapis.com/v1/images:annotate?key=" + key;

    /**
     * DOM Element jQuery handles, initialized here to reduce DOM queries
     * */
    var title = $("header > h1"),
        field = $("#camera-field"),
        content = $(".content"),
        cameraIcon = content.children(".glyphicon-camera"),
        loading = $(".loading");

    /**
     * Enum for app states:
     * initial - When camera button and icon are displayed
     * confirm - Confirmation dialog for submitting image
     * finish - Message after submitting image, either success, fail, or error
     * */
    var states = {
        initial: "initial",
        confirm: "confirm",
        finish: "finish"
    };

    /**
     * Used to track current state.
     * */
    var currentState = states.initial;

    /**
     * Reference to image file from camera
     * */
    var file;

    /**
     * Creates Vision API request and sends it.
     * Calls handleAPIResponse upon getting response or shows an error if something goes wrong
     *
     * @param {string} imageData - Photo, encoded as base64
     * */
    function sendToAPI(imageData) {

        // Strip header from base64 encoded image
        imageData = imageData.replace(/data:image\/(jpeg|png);base64,/, "");

        // Vision API request payload
        var data = {
            requests: [{
                image: {
                    content: imageData
                },
                features: [{
                    type: "TEXT_DETECTION"
                }]
            }]
        };

        // Make request
        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: handleAPIResponse,
            error: function () {
                var message = getMessage("Error", "Vision API responded with error");
                showState(states.finish, message);
            }
        });
    }

    /**
     * Handles response from Vision API.
     *
     * //TODO: add further handling for client API
     *
     * @param {Object} response - Response from Vision API
     * @param {Object[]} response.responses - Array of responses (for each request object)
     * @param {Object[]} response.responses[].textAnnotations - Annotations for request, returned from Vision API
     * */
    function handleAPIResponse(response) {

        var message;

        if (response.responses &&
                response.responses.length &&
                response.responses[0].textAnnotations) {
            message = getMessage("Success!", "Your image has been successfully submitted");
        } else {
            message = getMessage("Error", "Vision API returned empty response");
        }

        showState(states.finish, message);
    }

    /**
     * Changes view according to state
     *
     * @param {string} state - State from states enum.
     * Either initial, confirm, or finish
     * @param {HTMLElement} [element] - If provided, element is appended to content
     * */
    function showState(state, element) {

        // Clear content
        content.children().not(".glyphicon-camera").remove();

        // Hide loading indicator
        loading.hide();

        if (element) {
            content.append(element);
        }

        // Show relevant button group
        $(".step").not("." + state).addClass("hidden");
        $("." + state).removeClass("hidden");

        // Rest of state handling
        if (state === states.initial) {
            cameraIcon.show();
            file = null;
            title.html("Take photo");
        } else if (state === states.confirm) {
            cameraIcon.hide();
            title.html("Confirm");
        } else if (state === states.finish) {
            cameraIcon.hide();
            title.html($(".content h3").html());
        }

        // Change currentState to reflect current state
        currentState = state;
    }

    /**
     * Resizes image to fit into content, maintaining its aspect ratio
     *
     * @param {HTMLImageElement} image - Image to resize
     * @returns {HTMLImageElement} Resized image
     * */
    function resizeImage(image) {
        var contentRatio = content.height() / content.width();
        var imageRatio = image.height / image.width;

        if (contentRatio > imageRatio) {
            image.width = content.width();
            image.height = image.width * imageRatio;
        } else {
            image.height = content.height();
            image.width = image.height / imageRatio;
        }

        return image;
    }

    /**
     * Generates Div element to be appended to content.
     * Used for showing message to user.
     *
     * @param {string} title - Title of the message.
     * It'll be included in h3 tag, and same title will be set in header
     * @param {string} message - Message body.
     * It'll be included in a div tag inside container div
     * */
    function getMessage(title, message) {
        var container = document.createElement("div");
        var titleElement = document.createElement("h3");
        var messageElement = document.createElement("div");
        titleElement.innerHTML = title;
        messageElement.innerHTML = message;
        container.appendChild(titleElement);
        container.appendChild(messageElement);
        return container;
    }

    /**
     * Converts image to base64 using image/jpeg encoding.
     * Uses Canvas element, to maximize browser support
     *
     * @param {File} file - Image file (obtained from camera)
     * @param {Function} callback - Callback to be called after image has been converted.
     * Base64 string is passed to that callback as the only argument
     * */
    function imageToBase64(file, callback) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var image = new Image();

        $(image).on("load", function () {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);

            callback(canvas.toDataURL("image/jpeg"));
        });

        image.src = URL.createObjectURL(file);
    }

    /**
     * Orientationchange and resize handler.
     * Resizes image when in initial state
     * */
    $(window).on("orientationchange, resize", function () {
        if (currentState === states.confirm) {
            var image = content.children("img").get(0);
            image = resizeImage(image);
            content.append(image);
        }
    });

    /**
     * Camera button click handler.
     * Forwards click event to unstyled and off-screen input field (For cosmetic purposes)
     * */
    $("#camera-button").on("click", function () {
        field.click();
    });

    /**
     * Returns back from confirmation to initial state
     * */
    $("#retry-button").on("click", function () {
        showState(states.initial);
    });

    /**
     * Converts obtained image to base64.
     * Passes sendtToAPI as callback, so image is then sent to Vision API
     * */
    $("#send-button").on("click", function () {
        if (!file) {
            //TODO:  Show error
            return;
        }

        // Reveals small spinner in top right corner, indicating ongoing upload
        loading.show();
        imageToBase64(file, sendToAPI);
    });

    /**
     * Returns from finish state to initial
     * */
    $("#back-button").on("click", function () {
        showState(states.initial);
    });

    /**
     * Image input field change handler.
     * Obtains file and shows confirmation screen
     * */
    field.on("change", function (event) {
        var files = event.target.files;

        if (files.length === 1 && files[0].type.indexOf("image/") === 0) {
            file = files[0];

            var image = new Image();

            $(image).on("load", function () {
                image = resizeImage(image);
                showState(states.confirm, image);
            });

            image.src = URL.createObjectURL(file);
        }
    });
});
