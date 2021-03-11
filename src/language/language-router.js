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
      language: LanguageService.serializeLanguage(req.language),
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/head', async (req, res, next) => {
  try {
    let words = [
      ...(await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id
      )),
    ].sort((wordA, wordB) => wordA.memory_value - wordB.memory_value);

    const firstword = words[0];
    const nextWord = words[1];

    res.json({
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
      wordCorrectCount: words[0].correct_count, //correct count from second word
      wordIncorrectCount: words[0].incorrect_count, //incorrect count from second word
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

      response = {
        ...response,
        isCorrect: true,
        totalScore: language.total_score,
        wordCorrectCount: link.head.value.correct_count,
      };
    } else {
      //add to incorrect count
      link.head.value.incorrect_count++;
      //mem val goes up by one
      link.head.value.memory_value = 1;
      //incorrect false

      response = {
        ...response,
        isCorrect: false,
        wordIncorrectCount: link.head.value.incorrect_count,
      };
    }
    //grab memory value # from the current head
    m = link.head.value.memory_value;
    //setting temp = first value in LL
    temp = link.head;

    //this updates the current altered array and current score
    await LanguageService.insertNewLinkedList(
      req.app.get('db'),
      link.toArray()
    );
    LanguageService.updateLanguagetotalScore(req.app.get('db'), language);

    let lowestWord = [
      ...(await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id
      )),
    ].sort((wordA, wordB) => wordA.memory_value - wordB.memory_value)[0];

    LanguageService.SetLanguageHead(req.app.get('db'), language.id, {
      ...language,
      head: lowestWord.id,
    });

    //send back response to client
    res.json(response);
    next();
    //catch the error
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
