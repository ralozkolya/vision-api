$(function () {
    "use strict";

    var key = "AIzaSyACeyKJMbP_UjY3f0NexgRj97pPLGVEa8A";
    var url = "https://vision.googleapis.com/v1/images:annotate?key=" + key;

    var field = $("#camera-field");
    var content = $(".content");
    var cameraIcon = content.children(".glyphicon-camera");
    var loading = $(".loading");

    var states = {
        initial: "initial",
        confirm: "confirm",
        return: "return",
    };

    var currentState = states.initial;

    var file;

    $(window).on("orientationchange, resize", function () {
        if(currentState === states.confirm) {
            var image = content.children('img').get(0);
            image = resizeImage(image);
            content.append(image);
        }
    });

    $("#camera-button").on("click", function () {
        field.click();
    });

    $("#retry-button").on("click", function () {
        showState(states.initial);
    });

    $("#send-button").on("click", function () {
        if(!file) {
            // TODO: Show error
            return;
        }

        loading.show();

        imageToBase64(file, sendToAPI);
    });

    $("#return-button").on("click", function () {
        showState(states.initial);
    });

    field.on("change", function () {
        var files = this.files;

        if (files.length === 1 && files[0].type.indexOf("image/") === 0) {
            file = files[0];
            cameraIcon.hide();

            var image = new Image();

            $(image).on("load", function () {
                image = resizeImage(image);
                showState(states.confirm, image);
            });

            image.src = URL.createObjectURL(file);
        }
    });

    function sendToAPI(imageData) {

        imageData = imageData.replace("data:image/jpeg;base64,", "");

        var data = {
            requests: [{
                image: {
                        content: imageData,
                },
                features: [{
                    type: "TEXT_DETECTION",
                }],
            }],
        };

        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: handleResponse,
            complete: function () {
                loading.hide();
            },
        });
    }

    function handleResponse(response) {

        var message;

        if(response.responses &&
            response.responses.length &&
            response.responses[0].textAnnotations) {
            var text = JSON.stringify(response.responses[0].textAnnotations).substr(0, 150);
            message = getMessage("Success", text);
        }

        else {
            message = getMessage("Error", "Vision API returned empty response");
        }

        showState(states.return, message);
    }

    function showState(state, element) {

        content.children().not(".glyphicon-camera").remove();

        if(element) {
            content.append(element);
        }

        $(".step").not("."+state).addClass("hidden");
        $("."+state).removeClass("hidden");

        if(state === states.initial) {
            cameraIcon.show();
            file = null;
            loading.hide();
        }

        else if(state === states.confirm) {
            cameraIcon.hide();
        }

        else if(state === states.return) {
            cameraIcon.hide();
        }

        currentState = state;
    }

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

    function imageToBase64(file, callback) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var image = new Image();

        image.addEventListener("load", function () {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);

            callback(canvas.toDataURL('image/jpeg'));
        });

        image.src = URL.createObjectURL(file);
    }
});
