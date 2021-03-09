const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const LinkedList = require('./singly-linked-list');

const languageRouter = express.Router();
const jsonBodyParser = express.json();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    );

    if (!language)
      return res.status(404).json({
        error: `You don't have any languages`,
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

// This endpoint is /api/language/
// This .get route uses an async function with await (an operator that waits for a Promise)
// for the service function getLanguageWords (that takes in the db (req.app.get('db')) and language id (req.language.id))
// This will return the Promise and be able to access the Language and the words from word table in database
languageRouter.get('/', async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/head', async (req, res, next) => {
  try {
    let words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    const firstword = words[0];

    res.json({
      // ADDED WITH MIKE
      nextWord: firstword.original,
      wordCorrectCount: firstword.correct_count,
      wordIncorrectCount: firstword.incorrect_count,
      totalScore: req.language.total_score,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.post('/guess', jsonBodyParser, async (req, res, next) => {
  try {
    // destructure object
    const { guess } = req.body;

    if (!req.body.guess) {
      return res.status(400).json({
        error: `Missing 'guess' in request body`,
      });
    }

    // create new linkedlist
    const link = new LinkedList();
    //populate the new LL from the DB and returns an array of words
    const words = await LanguageService.PopulateLinkedlist(
      req.app.get('db'),
      req.language.id,
      link
    );

    //gets current users language from the DB
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    );
    //create response obj
    let response = {
      nextWord: words[1].original, //this is second word in array of words
      wordCorrectCount: words[1].correct_count, //correct count from second word
      wordIncorrectCount: words[1].incorrect_count, //incorrect count from second word
      totalScore: language.total_score, //total score from lang obj
      answer: words[0].translation, // translation from current words obj in words arr
      isCorrect: false, //setting default correct to false
    };

    //check if guess is right or wrong
    if (guess.toLowerCase() === link.head.value.translation) {
      //multiply mem val by 2
      link.head.value.memory_value *= 2;
      //add 1 to the correct counter
      link.head.value.correct_count++;
      //add 1 to the total score counter
      language.total_score += 1;
      //this makes isCorrect key true
      // ADDED WITH MIKE
      response = {
        ...response,
        isCorrect: true,
        totalScore: language.total_score,
      };
    } else {
      //add to incorrect count
      link.head.value.incorrect_count++;
      //mem val goes up by one
      link.head.value.memory_value = 1;
      //incorrect false
      // ADDED WITH MIKE
      response = {
        ...response,
        isCorrect: false,
      };
    }
    //grab memory value # from the current head
    m = link.head.value.memory_value;
    //setting temp = first value in LL
    temp = link.head;

    //while head && mem val is greater than 0
    while (temp.next !== null && m > 0) {
      //create temp variables
      let toriginal = temp.value.original;
      let ttranslation = temp.value.translation;
      let tcorrect_count = temp.value.correct_count;
      let tincorrect_count = temp.value.incorrect_count;
      let tm = temp.value.memory_value;

      //move positions based on mem val to new location
      temp.value.original = temp.next.value.original;
      temp.value.translation = temp.next.value.translation;
      temp.value.correct_count = temp.next.value.correct_count;
      temp.value.incorrect_count = temp.next.value.incorrect_count;
      temp.value.memory_value = temp.next.value.memory_value;

      //reassign values to correct positions
      temp.next.value.original = toriginal;
      temp.next.value.translation = ttranslation;
      temp.next.value.correct_count = tcorrect_count;
      temp.next.value.incorrect_count = tincorrect_count;
      temp.next.value.memory_value = tm;
      temp = temp.next;
      m--;
    }

    //this is the first val in our altered LL
    let arrtemp = link.head;
    //empty arr
    let linkarr = [];

    //whitle arrtemp(first val) exists
    while (arrtemp) {
      //push the value from the LL into the array
      linkarr.push(arrtemp.value);
      //this sets next val to be pushed into arr
      arrtemp = arrtemp.next;
    }

    // ADDED WITH MIKE
    response.nextWord = linkarr[0].original;

    //this updates the current altered array and current score
    await LanguageService.insertNewLinkedList(req.app.get('db'), linkarr);
    LanguageService.updateLanguagetotalScore(req.app.get('db'), language);

    // ADDED WITH MIKE
    let lowestWord = (
      await LanguageService.getLanguageWords(req.app.get('db'), req.language.id)
    ).sort((wordA, wordB) => wordA.memory_value - wordB.memory_value)[0];
    LanguageService.SetLanguageHead(req.app.get('db'), language.id, {
      ...language,
      head: lowestWord,
    });
    //send back response to client
    res.json(response), next();
    //catch the error
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
