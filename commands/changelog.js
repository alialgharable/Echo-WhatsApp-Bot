const { Octokit } = require("@octokit/rest");
const config = require("../config");

const octokit = new Octokit({ auth: config.github_auth_token });

const OWNER = "alialgharable";
const REPO_NAME = "Echo-WhatsApp-Bot";

async function getCommitMessageByNumber(owner, repo, commitNumber) {
  if (commitNumber < 1) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Commit Number must be >= 1",
    });
  }

  const page = Math.ceil(commitNumber / 100);
  const indexInPage = (commitNumber - 1) % 100;

  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 100,
    page: page,
  });

  const commit = commits[indexInPage];

  if (!commit) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: `❌ That many commits don't exist in ${REPO_NAME} repository`,
    });
  }

  return commit;
}

async function getCommitDetails(owner, repo, sha) {
  const response = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha, // commit hash
  });
  return response.data;
}

function formatDate(isoDateString) {
  const date = new Date(isoDateString);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // months start at 0
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}
module.exports = {
  name: "changelog",
  description: "See the most recent commit",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .changelog <commit number>(optional)\nExample:\n\t.changelog 2\n\t .changelog 1 (gets the latest changes)`,
      });
    }

    const commit_number = parseInt(args[0], 10);

    const commit = await getCommitMessageByNumber(
      OWNER,
      REPO_NAME,
      commit_number,
    );
    const commitdetails = await getCommitDetails(OWNER, REPO_NAME, commit.sha);
    const commit_date = formatDate(commit.commit.author.date);

    console.log("Commit: ", commit);
    // console.log("Commit Link: ", commit);
    // console.log("Commit Details: ", commitdetails.files[0]);

    let message = `Last Commit:
Author: ${commit.commit.author.name}
Commit Message: ${commit.commit.message} 
Commit Date: ${commit_date}
Commit Details: 
`;

    commitdetails.files.forEach((file) => {
      message += `\tFile name: ${file.filename}\n\tPrevious File name: ${file.previous_filename ?? "No change"}\n\tChanges: ${file.changes}\n\tAdditions: ${file.additions}\n\tDeletions: ${file.deletions}\n`;
    });

    message += `See More Details at: ${commit.html_url}`;
    await sock.sendMessage(msg.key.remoteJid, {
      text: message,
    });
  },
};
