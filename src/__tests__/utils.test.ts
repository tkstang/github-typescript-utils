import { describe, it, expect, vi } from "vitest";
import {
  getRepoInfo,
  getCurrentPullRequestNumber,
  getCurrentIssueNumber,
  isPullRequestContext,
  isIssueContext,
  getCurrentSHA,
  getCurrentBranch,
  getRepositoryUrl,
  getIssueUrl,
  getPullRequestUrl,
  truncateText,
  escapeMarkdown,
  codeBlock,
  createMarkdownTable,
  formatDate,
  parseGitHubDate,
  delay,
} from "../utils.js";

describe("truncateText", () => {
  it("should truncate text longer than maxLength", () => {
    expect(truncateText("Hello, World!", 10)).toBe("Hello, ...");
    expect(truncateText("Short", 10)).toBe("Short");
    expect(truncateText("Exactly10!", 10)).toBe("Exactly10!");
  });

  it("should handle edge cases", () => {
    expect(truncateText("", 5)).toBe("");
    expect(truncateText("Hi", 2)).toBe("Hi");
    expect(truncateText("Hi", 1)).toBe("...");
  });
});

describe("escapeMarkdown", () => {
  it("should escape markdown special characters", () => {
    expect(escapeMarkdown("*bold*")).toBe("\\*bold\\*");
    expect(escapeMarkdown("_italic_")).toBe("\\_italic\\_");
    expect(escapeMarkdown("`code`")).toBe("\\`code\\`");
    expect(escapeMarkdown("[link](url)")).toBe("\\[link\\]\\(url\\)");
  });

  it("should handle text without special characters", () => {
    expect(escapeMarkdown("plain text")).toBe("plain text");
  });
});

describe("codeBlock", () => {
  it("should create code blocks with language", () => {
    const result = codeBlock('console.log("hello");', "javascript");
    expect(result).toBe('```javascript\nconsole.log("hello");\n```');
  });

  it("should create code blocks without language", () => {
    const result = codeBlock("some code");
    expect(result).toBe("```\nsome code\n```");
  });
});

describe("createMarkdownTable", () => {
  it("should create a markdown table", () => {
    const headers = ["Name", "Age", "City"];
    const rows = [
      ["John", "30", "New York"],
      ["Jane", "25", "Los Angeles"],
    ];

    const expected = [
      "| Name | Age | City |",
      "| --- | --- | --- |",
      "| John | 30 | New York |",
      "| Jane | 25 | Los Angeles |",
    ].join("\n");

    expect(createMarkdownTable(headers, rows)).toBe(expected);
  });

  it("should handle empty rows", () => {
    const headers = ["Column1", "Column2"];
    const rows: string[][] = [];

    const expected = ["| Column1 | Column2 |", "| --- | --- |"].join("\n");

    expect(createMarkdownTable(headers, rows)).toBe(expected);
  });
});

describe("formatDate", () => {
  it("should format date to ISO string", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    expect(formatDate(date)).toBe("2024-01-15T10:30:00.000Z");
  });
});

describe("parseGitHubDate", () => {
  it("should parse GitHub date string", () => {
    const dateString = "2024-01-15T10:30:00Z";
    const parsed = parseGitHubDate(dateString);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(0); // January is 0
    expect(parsed.getDate()).toBe(15);
  });
});

describe("getRepoInfo", () => {
  it("should extract repository info from context", () => {
    const context = {
      repo: {
        owner: "test-owner",
        repo: "test-repo",
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getRepoInfo(ctx);
    expect(result).toEqual({
      owner: "test-owner",
      repo: "test-repo",
    });
  });
});

describe("getCurrentPullRequestNumber", () => {
  it("should return PR number from pull_request event", () => {
    const context = {
      eventName: "pull_request",
      payload: {
        pull_request: {
          number: 123,
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentPullRequestNumber(ctx);
    expect(result).toBe(123);
  });

  it("should return null for issue comment on PR (function only checks pull_request payload)", () => {
    const context = {
      eventName: "issue_comment",
      payload: {
        issue: {
          number: 456,
          pull_request: {},
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentPullRequestNumber(ctx);
    expect(result).toBeNull();
  });

  it("should return null for non-PR events", () => {
    const context = {
      eventName: "push",
      payload: {},
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentPullRequestNumber(ctx);
    expect(result).toBeNull();
  });
});

describe("getCurrentIssueNumber", () => {
  it("should return issue number from issues event", () => {
    const context = {
      eventName: "issues",
      payload: {
        issue: {
          number: 789,
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentIssueNumber(ctx);
    expect(result).toBe(789);
  });

  it("should return issue number from issue comment", () => {
    const context = {
      eventName: "issue_comment",
      payload: {
        issue: {
          number: 101,
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentIssueNumber(ctx);
    expect(result).toBe(101);
  });

  it("should return null for non-issue events", () => {
    const context = {
      eventName: "push",
      payload: {},
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentIssueNumber(ctx);
    expect(result).toBeNull();
  });
});

describe("isPullRequestContext", () => {
  it("should return true for pull_request event", () => {
    const context = {
      eventName: "pull_request",
      payload: {
        pull_request: {},
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    expect(isPullRequestContext(ctx)).toBe(true);
  });

  it("should return false for issue_comment (only checks pull_request payload)", () => {
    const context = {
      eventName: "issue_comment",
      payload: {
        issue: {
          pull_request: {},
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    expect(isPullRequestContext(ctx)).toBe(false);
  });

  it("should return false for regular issue", () => {
    const context = {
      eventName: "issues",
      payload: {
        issue: {},
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    expect(isPullRequestContext(ctx)).toBe(false);
  });
});

describe("isIssueContext", () => {
  it("should return true for issues event", () => {
    const context = {
      eventName: "issues",
      payload: {
        issue: {},
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    expect(isIssueContext(ctx)).toBe(true);
  });

  it("should return true for issue_comment", () => {
    const context = {
      eventName: "issue_comment",
      payload: {
        issue: {},
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    expect(isIssueContext(ctx)).toBe(true);
  });

  it("should return false for non-issue events", () => {
    const context = {
      eventName: "push",
      payload: {},
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    expect(isIssueContext(ctx)).toBe(false);
  });
});

describe("getCurrentSHA", () => {
  it("should return SHA from pull_request event", () => {
    const context = {
      eventName: "pull_request",
      payload: {
        pull_request: {
          head: {
            sha: "abc123",
          },
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentSHA(ctx);
    expect(result).toBe("abc123");
  });

  it("should return SHA from context.sha", () => {
    const context = {
      eventName: "push",
      sha: "def456",
      payload: {},
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentSHA(ctx);
    expect(result).toBe("def456");
  });

  it("should return undefined when SHA not available", () => {
    const context = {
      eventName: "issues",
      payload: {},
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentSHA(ctx);
    expect(result).toBeUndefined();
  });
});

describe("getCurrentBranch", () => {
  it("should return branch from pull_request event", () => {
    const context = {
      eventName: "pull_request",
      payload: {
        pull_request: {
          head: {
            ref: "feature-branch",
          },
        },
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentBranch(ctx);
    expect(result).toBe("feature-branch");
  });

  it("should return branch from push event", () => {
    const context = {
      eventName: "push",
      ref: "refs/heads/main",
      payload: {},
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentBranch(ctx);
    expect(result).toBe("main");
  });

  it("should return ref when branch not available in standard format", () => {
    const context = {
      eventName: "issues",
      payload: {},
      ref: "some-ref",
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getCurrentBranch(ctx);
    expect(result).toBe("some-ref");
  });
});

describe("getRepositoryUrl", () => {
  it("should return repository URL", () => {
    const context = {
      repo: {
        owner: "test-owner",
        repo: "test-repo",
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getRepositoryUrl(ctx);
    expect(result).toBe("https://github.com/test-owner/test-repo");
  });
});

describe("getIssueUrl", () => {
  it("should return issue URL", () => {
    const context = {
      repo: {
        owner: "test-owner",
        repo: "test-repo",
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getIssueUrl(ctx, 123);
    expect(result).toBe("https://github.com/test-owner/test-repo/issues/123");
  });
});

describe("getPullRequestUrl", () => {
  it("should return pull request URL", () => {
    const context = {
      repo: {
        owner: "test-owner",
        repo: "test-repo",
      },
    };

    const ctx = {
      core: { info: vi.fn() },
      github: {},
      context,
    } as any;

    const result = getPullRequestUrl(ctx, 456);
    expect(result).toBe("https://github.com/test-owner/test-repo/pull/456");
  });
});

describe("delay", () => {
  it("should delay execution", async () => {
    const start = Date.now();
    await delay(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(90); // Allow some variance
  });
});
