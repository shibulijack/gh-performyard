const Octokit = require("@octokit/rest");

const octokit = Octokit({
	auth: "GITHUB_AUTH_TOKEN",
	userAgent: "gh-performyard v1.0.0",
	baseUrl: "https://api.github.com"
});

const owner = "freshdesk";
const repo = "helpkit-ember";
const FROM_DATE = new Date(2019, 0, 1); // JAN 1, 2019
const USER_NAME = "shibulijack-fd";
const MAX_PAGES = 10;

async function listPRs(page) {
	let { data } = await octokit.pulls.list({
		owner,
		repo,
		state: "closed",
		base: "prestaging",
		per_page: 100,
		page
	});
	let myPRs = data.filter(
		pr =>
			pr.user.login === USER_NAME &&
			Date.parse(pr.created_at) > FROM_DATE.getTime()
	);
	let myPRReviews = data.filter(pr => {
		let isLatest = Date.parse(pr.created_at) > FROM_DATE.getTime();
		let isMine = pr.requested_reviewers.some(
			reviewer => reviewer.login === USER_NAME
		);
		return isLatest && isMine;
	});
	if (myPRs && myPRs.length > 0) {
		myPRs.forEach(pr => {
			console.log(`PR ${pr.number}`);
			console.log(`TITLE: ${pr.title}`);
			console.log(`DESCRIPTION: ${pr.body}`);
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
					`VELOCITY: Merged in ${days} days ${hours} hours ${minutes} minutes`
				);
			}
			console.log(`=================================`);
		});
		return new Promise(function(resolve, reject) {
			resolve({
				pr: myPRs.length,
				reviews: myPRReviews.length
			});
		});
	}
}

async function getAllPRs() {
	let totalNumberOfPRs = 0;
	let totalNumberOfReviews = 0;
	for (let p = 1; p < MAX_PAGES; p++) {
		let result = await listPRs(p);
		if (result) {
			let { pr, reviews } = result;
			totalNumberOfPRs += pr ? pr : 0;
			totalNumberOfReviews += reviews ? reviews : 0;
		}
	}
	console.log(`TOTAL PRs raised: ${totalNumberOfPRs}`);
	console.log(`TOTAL PRs reviewed: ${totalNumberOfReviews}`);
}

getAllPRs();
