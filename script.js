//Word API: https://rapidapi.com/sheharyar566/api/random-words5/
//Dictionary API: https://dictionaryapi.dev/ 
const HOST = "random-words5.p.rapidapi.com";
const API_KEY = "8bd4e98aadmsh33deda327f6452ep1aa4f7jsn24b31d322cf2";

const options = {
    method: 'GET',
    headers: {
        "X-RapidAPI-Host": HOST,
        "X-RapidAPI-Key": API_KEY
    }
}

/*  I only have 250 calls to the word API per month
    I don't think I came even close that limit
    but please let me know if you are getting an error
    it only costs 1c per call after that but I will need to
    authorize it before it will work    */

// letter class
class Letter
{

    constructor(char, row, state = "unguessed")
    {
        this.char = char;
        this.state = state;
        this.row = row;
    }

    // draw element to keyboard
    add_keyboard()
    {
        let but = document.createElement("button");
        but.innerText = this.char;
        but.id=this.char;
        but.className = this.state; 

        but.addEventListener("click", () =>{
          this.write_to_input();
        })

        document.getElementById("row" + this.row).append(but); 
    }

    // draw element to gameboard when a guess has been made
    add_guess(row, state)
    {
        let div = document.createElement("div");
        div.innerText = this.char;
        div.className = state;
        document.getElementById("row" + row).append(div); 
    }

    // update keyboard colors
    update_keyboard(state)
    {
        this.state = state;
        document.getElementById(this.char).className = state;
    }


}


// game and stat variables
var word;
var guess_number;
var letters = [];
var wins = 0;
var games = 0;
win_distrobution = [0,0,0,0,0,0];

// make API call to retrieve new word
// assign to word variable
function get_word_api()
{

    fetch("https://random-words5.p.rapidapi.com/getMultipleRandom?count=1&wordLength=5", options)
    .then(response => response.json())
    .then(response=> {

        word = response[0];
        document.getElementById("word").innerText = `the word is: ${word}`;

    })
    .catch(error => console.log("error: " + error))
}


// draw keyboard letter list to bottom of page
function generate_keyboard()
{

    // remove previous keyboard to aid in resetting game
    removeChildren(document.getElementById("keyboard"));

    // character list
    source_chars = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

    let index = 1;
    source_chars.forEach(word => {

        // create keyboard row
        let row = document.createElement("div");
        row.className = "row";
        row.id = "row" + index;
        document.getElementById("keyboard").append(row);

        // draw letters
        for (let i=0; i<word.length; i++)
        {
            let l = new Letter(word[i], index);
            l.add_keyboard();
            letters[word[i]] = l;
        }  
        index++;   
    });
}


function reset_game()
{

    //reset html elements
    document.getElementById("guess").disabled = false;
    document.getElementById("update").innerText = "";
    document.getElementById("debug").disabled = true;
    document.getElementById("start").disabled = true;
    document.getElementById("info").style.display = "block";
    document.querySelector("html").removeAttribute("class");

    if (document.getElementById("debug").checked)
    {
        document.getElementById("word").style.display = "block";
    } else
    {
        document.getElementById("word").style.display = "none";
    }

    // assign word
    get_word_api();

    // clear board and wipe keyboard
    removeChildren(document.getElementById("gameboard"));
    generate_keyboard();
    guess_number = 0;

}

// prepare page & add events
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById("guess").addEventListener("click", () => {
        check_word_api(document.getElementById("input").value);
    })

    document.getElementById("start").addEventListener("click", reset_game);
    
    // add keyboard control to submitting word
    document.addEventListener("keydown" , (event) => {

        if (event.keyCode == 13)
        {

            if (document.getElementById("guess").disabled == false)
            {
                check_word_api(document.getElementById("input").value);
            }
        }
    })

})

// check if word is in dictionary using dictionary api
function check_word_api(guess)
{

    // reset input
    document.getElementById("input").value = "";

    // only allow 5 letter guesses
    if (guess.length != 5)
    {
        invalid_word();
        return
    }
    
    // check if word is in the dictionary
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`)
    .then(data => {
        if (!data.ok){
            invalid_word()
        } else {
            make_guess(guess);
        }
    })

}


function make_guess(guess)
{

    let new_row = document.createElement("div");
    new_row.className = "row";
    new_row.id = "row" + (guess_number + 4);
    document.getElementById("gameboard").append(new_row);

    for (let i = 0; i < word.length; i++)
    {
        
        // udpate keyboard display with new information
        // draw guess to gameboard
        if (guess[i] == word[i])
        {

            letters[guess[i]].add_guess(guess_number + 4, "correct");
            letters[guess[i]].update_keyboard("correct");


        // ensure that the accuracy of the keyboard can never be downgraded
        // ie: a letter can never turn from green to yellow
        } else if (word.includes(guess[i]))
        {

            letters[guess[i]].add_guess(guess_number + 4, "found");

            if (letters[guess[i]].state != "correct")
            {
                letters[guess[i]].update_keyboard("found");
            }
           
        //  or from yellow to gray
        } else 
        {

            letters[guess[i]].add_guess(guess_number + 4, "wrong");

            if (letters[guess[i]].state == "unguessed")
            {
                letters[guess[i]].update_keyboard("wrong");
            }
        }

    }

    // trigger a win
    if (guess == word)
    {
        win_game();
        return;
    }

    // if after 6 guesses the word has not been found, end game in a loss
    if (guess_number == 5){
        lose_game();
        return;
    }

    guess_number++;
    document.getElementById("update").innerText = ("Guesses remaining: " + (6-guess_number));

}

function invalid_word()
{

    alert("word not found, try again");

}

function win_game()
{
    
    document.getElementById("guess").disabled = true;
    document.getElementById("debug").disabled = false;
    document.getElementById("start").disabled = false;
    document.querySelector("html").className = "winAnimation";
    wins++;
    games++;
    win_distrobution[guess_number]++; 
    document.getElementById("update").innerText = "You Win! Press start to play again.\n" + show_stats();
}

function lose_game()
{
    
    document.getElementById("guess").disabled = true;
    document.getElementById("debug").disabled = false;
    document.getElementById("start").disabled = false;
    document.querySelector("html").className = "loseAnimation";
    games++;
    document.getElementById("update").innerText = `Sorry, you lose! The word was ${word}\nPress start to play again.\n` + show_stats();

}

// returns a string sumarizing the player's stats
function show_stats()
{
    win_loss = (wins/games * 100).toFixed(0);
    let win_dist_string = "| ";
    let index = 1;
    win_distrobution.forEach(element => {
        win_dist_string += index + "-" + parseInt(element) + " | ";
        index++;
    });
    let stats_string = `Win Ratio: ${win_loss}%\n` + "Winning guess distrobution:\n" + win_dist_string;
    return stats_string;
}


// quick helper funciton to aid in reseting html elements
function removeChildren(parent) 
{
    while (parent.firstChild) 
    {
        parent.removeChild(parent.firstChild);
    }
}