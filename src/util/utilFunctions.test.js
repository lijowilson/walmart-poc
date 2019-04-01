import {validateScrapeRequest} from "./utilFunctions";

test('testing Scraping Request Object of username and password positive test',
  () => {
    
    //username password present
    const username = 'test@legomail.com'; //valid email
    const password = 'testpassword'; //valid password
    expect(validateScrapeRequest(username, password)).toBeTruthy();
  });

test('testing Scraping Request Object of username and password negative test' +
  ' with no password', () => {
  
  //username password present
  const username = 'test@legomail.com'; //valid email
  const password = ''; //valid password
  expect(validateScrapeRequest(username, password)).toBeFalsy();
});

test('testing Scraping Request Object of username and password negative test ' +
  'with invalid email', () => {
  
  //username password present
  const username = 'test@l'; //invalid email
  const password = 'test33'; //valid password
  expect(validateScrapeRequest(username, password)).toBeFalsy();
});
