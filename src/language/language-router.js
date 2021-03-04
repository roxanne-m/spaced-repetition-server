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
    const firstWord = words[0];
    res.json({
      nextWord: firstWord.original,
      wordCorrectCount: firstWord.correct_count,
      wordIncorrectCount: firstWord.incorrect_count,
      totalScore: req.language.total_score,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.post('/guess', jsonBodyParser, async (req, res, next) => {
  let spacedRepetitionDb = req.app.get('db');

  try {
    // destructure object
    const { guess } = req.body;

    if (!req.body.guess) {
      return res.status(400).json({
        error: `Missing 'guess' in request body`,
      });
    }

    // create new linked list
    let list = new LinkedList();
    // get head, insert into Linked list (pass in db and language head)
    // let headNode = await LanguageService.getWordById(
    //   spacedRepetitionDb,
    //   req.language.head
    // );

    // list.insertFirst(headNode);

    // get the rest of the words, insert into Linked list
    // while condition to check if more words exist in db

    // while (headNode.next !== null) {
    //   let nextNode = await LanguageService.getWordById(
    //     spacedRepetitionDb,
    //     headNode.next
    //   );
    //   list.insertLast(nextNode);
    //   headNode = nextNode;
    // }

    // populate the linked list created with information
    let words = await LanguageService.populateLinkedList(
      spacedRepetitionDb,
      req.language.id,
      list,
      req.language.head
    );
    // get current user's language from database
    let language = await LanguageService.getUsersLanguage(
      spacedRepetitionDb,
      req.user.id
    );

    // create response object
    let response = {
      nextWord: words[1].original, // second word in array of words
      // totalScore: language.total_score, // total score from language object
      wordCorrectCount: words[1].correct_count, // correct count from second word
      wordIncorrectCount: words[1].incorrect_count, // incorrect count from second word
      answer: words[0].translation, // translation from current words obj in words array
      isCorrect: false, // set default correct to false
    };

    if (guess.toLowerCase() === list.head.value.translation) {
      // add one to the correct count
      list.head.value.correct_count++;

      // Double the value of M (memory values)
      list.head.value.memory_value *= 2;

      // increase total score
      language.total_score += 1;

      // make isCorrect to true
      response = { ...response, isCorrect: true };
    } else {
      // increase incorrect count
      list.head.value.incorrect_count++;

      // reset M (memory value to 1)
      list.head.value.memory_value = 1;

      // make isCorrect to false
      response = { ...response, isCorrect: false };
    }
    response.totalScore = language.total_score;

    // store head in temp variable
    let temp = list.head;
    // store memory value from current head
    let memVal = list.head.value.memory_value;

    // while head and memory value is greater than 0
    while (temp.next !== null && memVal > 0) {
      // create temp variables
      let tempOriginal = temp.value.original;
      let tempTranslation = temp.value.translation;
      let tempCorrect_Count = temp.value.correct_count;
      let tempIncorrect_Count = temp.value.incorrect_count;
      let tempMemory_Value = temp.value.memory_value;
      let tempId = temp.value.id;

      // Move positions based on memory values to a new location
      temp.value.original = temp.next.value.original;
      temp.value.translation = temp.next.value.translation;
      temp.value.correct_count = temp.next.value.correct_count;
      temp.value.incorrect_count = temp.next.value.incorrect_count;
      temp.value.memory_value = temp.next.value.memory_value;
      temp.value.id = temp.next.value.id;

      // reassign values to correct positions
      temp.next.value.original = tempOriginal;
      temp.next.value.translation = tempTranslation;
      temp.next.value.correct_count = tempCorrect_Count;
      temp.next.value.incorrect_count = tempIncorrect_Count;
      temp.next.value.memory_value = tempMemory_Value;
      temp.next.value.id = tempId;
      temp = temp.next;
      memVal--;
    }

    let node = list.head;
    while (node) {
      node.value.next = node.next ? node.next.value.id : null;
      node = node.next;
    }
    // first value in our altered linked list
    let arrayTemp = list.head;

    // create empty array
    let linkArray = [];

    // while arrayTemp head (first value) exists
    while (arrayTemp) {
      //push value from linked list into array
      linkArray.push(arrayTemp.value);
      // set next value to arrayTemp so it can be pushed into the array
      arrayTemp = arrayTemp.next;
    }

    language.head = list.head.value.id;
    // update the current altered array and current score
    LanguageService.insertNewLinkedList(spacedRepetitionDb, linkArray);
    LanguageService.updateLanguageTotalScore(spacedRepetitionDb, language);
    await LanguageService.updateHead(spacedRepetitionDb, language);

    // return res.status(200).json(response);
    res.json(response), next();
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
