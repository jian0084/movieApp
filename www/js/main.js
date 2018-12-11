/********************************
Author: @Joyce
Description: Uss API to get data of movies and TVs to build a search engine
Date: Nov 28, 2018
*********************************/

var JIAN0084 = {
    foo: function () {

        /* globals APIKEY */

        const movieDataBaseURL = "https://api.themoviedb.org/3/";

        let imageURL = null;
        let imageSizes = [];

        let videoType = "movie";
        let searchString = "";

        let imageURLKey = "imageURL";
        let imageSizesKey = "imageSizesKey";

        let timeKey = "timeKey";
        let staleDataTimeOut = 60;

        if (document.deviceready) {
            document.addEventListener("deviceready", init);
        } else {
            document.addEventListener("DOMContentLoaded", init);
        }


        function init() {

            //                        localStorage.clear();

            addEventListeners();

            getLocalStorageData();

        }

        function addEventListeners() {
            let searchButton = document.querySelector(".search-button");
            document.querySelector(".modalButton").addEventListener("click", showOverlay);
            document.querySelector(".cancelButton").addEventListener("click", hideOverlay);
            document.querySelector(".overlay").addEventListener("click", hideOverlay);
            document.querySelector(".saveButton").addEventListener("click", function (e) {
                let videoList = document.getElementsByName("video");

                for (let i = 0; i < videoList.length; i++) {
                    if (videoList[i].checked) {
                        videoType = videoList[i].value;
                        break;
                    }
                }

                hideOverlay(e);
                console.log("You picked " + videoType);

            })

            searchButton.addEventListener("click", startSearch);

            document.querySelector(".back-button").addEventListener("click", goBack);
        }

        function goBack() {
            console.log("back");
            startSearch();
        }

        function showOverlay(e) {
            e.preventDefault();
            let overlay = document.querySelector(".overlay");
            overlay.classList.remove("hide");
            overlay.classList.add("show");
            showModal(e);
        }

        function showModal(e) {
            e.preventDefault();
            let modal = document.querySelector(".modal");
            modal.classList.remove("off");
            modal.classList.add("on");
        }

        function hideOverlay(e) {
            e.preventDefault();
            e.stopPropagation(); // don't allow clicks to pass through
            let overlay = document.querySelector(".overlay");
            overlay.classList.remove("show");
            overlay.classList.add("hide");
            hideModal(e);
        }

        function hideModal(e) {
            e.preventDefault();
            let modal = document.querySelector(".modal");
            modal.classList.remove("on");
            modal.classList.add("off");
        }


        function getLocalStorageData() {
            console.log(localStorage);

            if (localStorage.getItem(imageURLKey) && localStorage.getItem(imageURLKey)) {

                imageURL = localStorage.getItem(imageURLKey);
                imageSizes = JSON.parse(localStorage.getItem(imageSizesKey));

                //                imageURL = JSON.parse(localStorage.getItem(imageURLKey) || null);
                //                imageSizes = JSON.parse(localStorage.getItem(imageSizesKey) || "[]");

                if (localStorage.getItem(timeKey)) {
                    let savedDate = localStorage.getItem(timeKey);
                    savedDate = new Date(savedDate);
                    console.log(savedDate);
                    let now = new Date();
                    console.log(now);
                    let elapsedTime = now.getTime() - savedDate.getTime(); // this in milliseconds
                    let minutes = Math.ceil(elapsedTime / 60000);
                    console.log(minutes + " minutes"); // Math.ceil
                    if (minutes > staleDataTimeOut) {
                        console.log("Local Storage Data is stale, performing new Fetch Update");
                        getMoviePosterPathAndSizes();
                    }
                    console.log("Image URL and Size Data retrieved from Local Storage");
                    console.log(imageURL);
                    console.log(imageSizes);
                }

                console.log("Data loaded from LocalStorage");

            } else {
                console.log("Data NOT loaded from Local Storage");
                //doesn't exist in local storage so go get it
                getMoviePosterPathAndSizes();

            }

        }

        function getMoviePosterPathAndSizes() {
            let url = `${movieDataBaseURL}configuration?api_key=${APIKEY}`;

            fetch(url)
                .then(response => response.json())
                .then(function (data) {
                    console.log(data);
                    imageURL = data.images.secure_base_url; // "https://image.tmdb.org/t/p/"
                    imageSizes = data.images.poster_sizes;

                    console.log(imageURL);
                    console.log(imageSizes);

                    //                    localStorage.setItem(imageURLKey, JSON.stringify(imageURL));
                    localStorage.setItem(imageURLKey, imageURL);
                    localStorage.setItem(imageSizesKey, JSON.stringify(imageSizes));
                    //                    localStorage.setItem(imageSizesKey, imageSizes);
                    console.log("Image URL and Size Data saved to Local Storage");

                    console.log(imageURL);
                    console.log(imageSizes);
                    console.log("after");

                    let now = new Date();
                    localStorage.setItem(timeKey, now);

                })
                .catch((error) => console.log(error));

        }

        function startSearch() {

            searchString = document.getElementById("search-input").value;
            if (!searchString) {
                alert("Please enter search data");
                return;
            }

            getSearchResults();
        }

        function getSearchResults() {
            // https://developers.themoviedb.org/3/search/search-movies  look up search movie (also TV Shows)

            let url = "";
            if (videoType == "movie") {
                url = `${movieDataBaseURL}search/movie?api_key=${APIKEY}&query=${searchString}`;
            } else if (videoType == "TV") {
                url = `${movieDataBaseURL}search/tv?api_key=${APIKEY}&query=${searchString}`;
            }


            fetch(url)
                .then(response => response.json())
                .then(function (data) {
                    console.log(data);
                    //  create the page from data
                    createPage(data);
                    //  navigate to "results";
                })
                .catch((error) => console.log(error));

        }

        function createPage(data) {

            let content = document.querySelector("#search-results>.content");
            let title = document.querySelector("#search-results>.title");

            let message = document.createElement("h2");
            message.classList.add("message");
            content.innerHTML = "";
            title.innerHTML = "";

            if (data.total_results == 0) {
                message.innerHTML = `No results found for ${searchString}`;
            } else {
                message.innerHTML = `${data.total_results} results for "${searchString}"`;
            }

            title.appendChild(message);

            let documentFragment = new DocumentFragment();

            documentFragment.appendChild(createVideoCards(data.results));

            content.appendChild(documentFragment);

            let cardList = document.querySelectorAll(".content>div");

            cardList.forEach(function (item) {
                item.addEventListener("click", getRecommendations);
            });

        }

        function createVideoCards(results) {
            let documentFragment = new DocumentFragment();

            results.forEach(function (video) {

                let videoCard = document.createElement("div");
                let section = document.createElement("section");
                let image = document.createElement("img");
                let videoTitle = document.createElement("p");
                let videoDate = document.createElement("p");
                let videoRating = document.createElement("p");
                let videoOverview = document.createElement("p");

                // set up the content
                if (videoType == "movie") {
                    videoTitle.textContent = video.title;
                    videoDate.textContent = video.release_date;
                    videoRating.textContent = video.vote_average;
                    videoOverview.textContent = video.overview;
                    // set up video data attributes
                    videoCard.setAttribute("data-title", video.title);
                    videoCard.setAttribute("data-id", video.id);
                } else if (videoType == "TV") {
                    videoTitle.textContent = video.name;
                    videoDate.textContent = video.release_date;
                    videoRating.textContent = video.vote_average;
                    videoOverview.textContent = video.overview;
                    // set up video data attributes
                    videoCard.setAttribute("data-title", video.name);
                    videoCard.setAttribute("data-id", video.id);
                }

                // set up image source URL
                image.src = `${imageURL}${imageSizes[2]}${video.poster_path}`;



                // set up class names
                videoCard.className = "videoCard";
                section.className = "imageSection";

                // append elements
                section.appendChild(image);
                videoCard.appendChild(section);
                videoCard.appendChild(videoTitle);
                videoCard.appendChild(videoDate);
                videoCard.appendChild(videoRating);
                videoCard.appendChild(videoOverview);

                documentFragment.appendChild(videoCard);

            })
            return documentFragment;
        }

        function getRecommendations() {

            console.log(this);
            //    console.log(e.target);
            let url = "";

            if (videoType == "movie") {
                let movieTitle = this.getAttribute("data-title");
                let movieID = this.getAttribute("data-id");
                console.log("you clicked: " + movieTitle + " " + movieID);
                url = `${movieDataBaseURL}movie/${movieID}/recommendations?api_key=${APIKEY}`;

            } else if (videoType == "TV") {
                let tvTitle = this.getAttribute("data-title");
                let tvID = this.getAttribute("data-id");
                console.log("you clicked: " + tvTitle + " " + tvID);
                url = `${movieDataBaseURL}tv/${tvID}/recommendations?api_key=${APIKEY}`;
                console.log(url);
            }


            document.querySelector(".back-button").classList.remove("hide");

            console.log(searchString);

            let title = this.getAttribute("data-title");
            console.log(title);

            fetch(url)
                .then(response => response.json())
                .then(function (data) {
                    console.log(data);
                    //  create the page from data
                    createPage(data);
                    //  navigate to "results";

                    //change the message

                    let message = document.querySelector(".message");
                    //                    title.innerHTML = "";

                    message.innerHTML = `${data.total_results} recommendations for "${title}"`;

                    //                    title.appendChild(message);
                })
                .catch((error) => console.log(error));
        }


    }
}

JIAN0084.foo();
