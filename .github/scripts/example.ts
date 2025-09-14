import {
  pullRequestHasLabels,
  getCurrentPullRequestNumber,
  getRepoInfo,
  sanitizeInput,
  escapeMarkdown,
  formatDate,
  checkBranchExists,
} from "github-typescript-utils";

type Ctx = {
  core: typeof import("@actions/core");
  github: ReturnType<typeof import("@actions/github").getOctokit>;
  context: typeof import("@actions/github").context;
  args: {
    testMessage: string;
    testLabels: string[];
    testBranch: string;
  };
};

/**
 * E2E test script that exercises various utility functions
 * to verify they can be imported and bundled correctly
 */
export default async function run({ core, github, context, args }: Ctx) {
  core.info("🚀 Starting E2E test of github-typescript-utils");

  try {
    const ctx = { core, github, context };

    // Test 1: Input sanitization
    const sanitizedMessage = sanitizeInput(args.testMessage);
    core.info(
      `✅ Input sanitization: "${args.testMessage}" → "${sanitizedMessage}"`
    );

    // Test 2: Text formatting utilities
    const escapedText = escapeMarkdown("**Bold** _italic_ `code`");
    const formattedDate = formatDate(new Date());
    core.info(
      `✅ Text formatting: escaped="${escapedText}", date="${formattedDate}"`
    );

    // Test 3: Context utilities
    const repoInfo = getRepoInfo(ctx);
    core.info(`✅ Repo info: ${repoInfo.owner}/${repoInfo.repo}`);

    // Test 4: PR context (if available)
    const prNumber = getCurrentPullRequestNumber(ctx);
    if (prNumber) {
      core.info(`✅ PR context: Found PR #${prNumber}`);

      // Test PR utilities
      const hasLabels = await pullRequestHasLabels({
        ctx,
        repo: repoInfo,
        pullNumber: prNumber,
        labels: args.testLabels,
      });
      core.info(
        `✅ PR label check: has labels [${args.testLabels.join(
          ", "
        )}] = ${hasLabels}`
      );
    } else {
      core.info("ℹ️ No PR context available, skipping PR-specific tests");
    }

    // Test 5: Branch utilities
    const branchExists = await checkBranchExists({
      ctx,
      repo: repoInfo,
      branch: args.testBranch,
    });
    core.info(`✅ Branch check: "${args.testBranch}" exists = ${branchExists}`);

    core.info("🎉 E2E test completed successfully!");

    return {
      success: true,
      testsRun: 7,
      repoInfo,
      prNumber,
      branchExists,
    };
  } catch (error) {
    core.error(`❌ E2E test failed: ${error}`);
    core.setFailed(`E2E test failed: ${error}`);
    return { success: false, error: String(error) };
  }
}
