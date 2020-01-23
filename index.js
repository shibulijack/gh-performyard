const Octokit = require("@octokit/rest");
const CONFIG = require("./config");
const COLORS = require("colors");

const octokit = Octokit({
  auth: CONFIG.GITHUB_AUTH_TOKEN,
  userAgent: "gh-performyard v1.0.0",
  baseUrl: "https://api.github.com"
});

const FROM_DATE = new Date(2019, 0, 1); // JAN 1, 2019
const MAX_PAGES = 10;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function listReviews(pull_number, title) {
  console.log("Processing ".yellow + `PR#${pull_number} `.grey + `${title}`);
  let { data } = await octokit.pulls.listReviews({
    owner: CONFIG.GITHUB_ORG,
    repo: CONFIG.GITHUB_REPO,
    pull_number
  });
  return data;
}

async function getReviewCount(pulls) {
  let count = 0;
  let reviewCounting = asyncForEach(pulls, async pr => {
    let reviews = await listReviews(pr.number, pr.title);
    if (
      reviews &&
      reviews.length > 0 &&
      reviews.some(
        review => review.user && review.user.login === CONFIG.GITHUB_USER
      )
    ) {
      count += 1;
    }
  });
  await reviewCounting;
  return count;
}

async function listPRs(page) {
  let { data } = await octokit.pulls.list({
    owner: CONFIG.GITHUB_ORG,
    repo: CONFIG.GITHUB_REPO,
    state: CONFIG.PR_STATE || "closed",
    base: CONFIG.PR_BASE_BRANCH || "master",
    per_page: 100,
    page
  });
  let myPRs = data.filter(
    pr =>
      pr.user.login === CONFIG.GITHUB_USER &&
      Date.parse(pr.created_at) > FROM_DATE.getTime()
  );
  let myPRReviews = data.filter(pr => {
    let isLatest = Date.parse(pr.created_at) > FROM_DATE.getTime();
    let isMine = pr.requested_reviewers.some(
      reviewer => reviewer.login === CONFIG.GITHUB_USER
    );
    return isLatest && isMine;
  });

  if (myPRs && myPRs.length > 0) {
    myPRs.forEach(pr => {
      console.log(`PR#${pr.number}`.green);
      console.log(`
${pr.title}`);
      if (pr.body) {
        console.log(
          `
${pr.body}`.grey
        );
        console.log("\n");
      }
      if (pr.merged_at) {
        let delta =
          Math.abs(Date.parse(pr.merged_at) - Date.parse(pr.created_at)) / 1000;
        let days = Math.floor(delta / 86400);
        delta -= days * 86400;
        let hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        let minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        console.log(
          `Merged in ${days} days ${hours} hours ${minutes} minutes`.cyan
        );
      } else {
        console.log(`Not yet merged`.red);
      }
      console.log("\n");
      console.log(`=============================================`.gray);
      console.log("\n");
    });
    return new Promise(function(resolve, reject) {
      resolve({
        data,
        pr: myPRs.length,
        reviews: myPRReviews.length
      });
    });
  }
}

async function getAllPRs() {
  let totalNumberOfPRs = 0;
  let myCompletedReviews = 0;
  let totalNumberOfReviews = 0;
  let allPRs = [];
  console.log(
    "Repo: ".bold + `${CONFIG.GITHUB_ORG}/${CONFIG.GITHUB_REPO}`.green
  );
  console.log("User: ".bold + `${CONFIG.GITHUB_USER}`.green);
  console.log("\n");
  console.log(`Fetching data from Github...`.yellow);
  console.log("\n");

  // Get all PR data
  for (let p = 1; p < MAX_PAGES; p++) {
    let result = await listPRs(p);
    if (result) {
      let { pr, reviews, data } = result;
      allPRs = allPRs.concat(data);
      totalNumberOfPRs += pr ? pr : 0;
      totalNumberOfReviews += reviews ? reviews : 0;
    }
  }

  console.log(`Generating PR stats from Github...`.yellow);
  console.log("\n");
  myCompletedReviews = await getReviewCount(allPRs);
  totalNumberOfReviews += myCompletedReviews;

  console.log("\n");
  console.log(`TOTAL PRs raised:`.bold);
  console.log(`${totalNumberOfPRs}`.bold.green);
  console.log("\n");
  console.log(`TOTAL PRs reviewed:`.bold);
  console.log(`${totalNumberOfReviews}`.bold.green);
}

getAllPRs();
