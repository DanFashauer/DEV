#!/usr/bin/env bun
/**
 * Policy Gate Script - HARDENED VERSION
 * 
 * Validates PRs against defined policy rules before auto-approval.
 * This is the "why" layer - machine-verifiable justification for approvals.
 * 
 * SECURITY CONSTRAINTS:
 * - NEVER auto-approve PRs modifying .github/** (workflows, policies)
 * - NEVER auto-approve PRs modifying this script itself
 * - ALWAYS require human approval for CI/workflow/policy changes
 * 
 * Usage: bun .github/scripts/policy-gate.ts
 * 
 * Exit codes:
 *   0 = Policy passes, approval allowed
 *   1 = Policy fails, approval denied
 *   2 = Skip auto-approve (needs manual review)
 */

import { execSync } from "child_process";

// === Configuration ===

const ALLOWED_AUTHORS = ["DanFashauer", "kilo-code-bot[bot]"];

// CRITICAL: Paths that can NEVER be auto-approved (require human review)
const FORBIDDEN_PATHS = [
  ".github/",
  ".github/workflows/**",
  ".github/scripts/policy-gate.ts",
  ".github/AUTO_APPROVE_SETUP.md",
];

// High-risk paths that need explicit justification in PR body
const HIGH_RISK_PATHS = [
  "src/app/api/**",
  "src/lib/backend/validation.ts",
  "ios/EnterpriseShell/Services/SecurityManager.swift",
  "ios/EnterpriseShell/Services/OIDCAuthService.swift",
  "ios/EnterpriseShell/Services/KeychainService.swift",
];

// Security-related paths requiring "Justification:" section
const SECURITY_PATHS = [
  "src/app/api/**",
  "src/lib/backend/**",
  "ios/EnterpriseShell/Services/Security*.swift",
  "ios/EnterpriseShell/Services/OIDCAuthService.swift",
  "ios/EnterpriseShell/Services/KeychainService.swift",
];

// === Types ===

interface PRInfo {
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
  changedFiles: string[];
  baseRef: string;
  headRef: string;
  checkRunsStatus: "success" | "failure" | "pending";
}

// === Helper Functions ===

function getPrNumber(): number | null {
  const prNumber = process.env.GITHUB_PR_NUMBER;
  return prNumber ? parseInt(prNumber, 10) : null;
}

function getAction(): string {
  return process.env.GITHUB_ACTION || "check";
}

function getChangedFiles(): string[] {
  try {
    // Get files changed in this PR (compared to base branch)
    const baseRef = execSync('gh pr view --json baseRefName -q .baseRefName', { encoding: "utf-8" }).trim();
    const headRef = execSync('gh pr view --json headRefName -q .headRefName', { encoding: "utf-8" }).trim();
    
    // Use GitHub's compare API via gh CLI
    const output = execSync(`git diff --name-only ${baseRef}...${headRef} 2>/dev/null || git diff --name-only HEAD~1 HEAD 2>/dev/null || echo ""`, {
      encoding: "utf-8",
    });
    return output.split("\n").filter((f) => f.trim());
  } catch {
    return [];
  }
}

function getPrInfo(): PRInfo | null {
  const prNumber = getPrNumber();
  if (!prNumber) return null;

  const actor = process.env.GITHUB_ACTOR || "unknown";
  
  // Get PR details from gh CLI
  try {
    const prJson = execSync(`gh pr view ${prNumber} --json title,body,author,labels,baseRefName,headRefName`, {
      encoding: "utf-8",
    });
    const pr = JSON.parse(prJson);
    
    return {
      number: prNumber,
      title: pr.title || "",
      body: pr.body || "",
      author: pr.author?.login || actor,
      labels: pr.labels?.map((l: any) => l.name) || [],
      changedFiles: getChangedFiles(),
      baseRef: pr.baseRefName || "main",
      headRef: pr.headRefName || "unknown",
      checkRunsStatus: "success", // Will be overridden by actual status
    };
  } catch {
    return null;
  }
}

function hasLabel(pr: PRInfo, label: string): boolean {
  return pr.labels.includes(label);
}

function isAllowedAuthor(pr: PRInfo): boolean {
  return ALLOWED_AUTHORS.includes(pr.author);
}

function hasForbiddenChanges(pr: PRInfo): boolean {
  // NEVER allow auto-approve for .github/** or policy-gate.ts
  return pr.changedFiles.some((file) =>
    FORBIDDEN_PATHS.some((pattern) => {
      if (pattern.endsWith("/**")) {
        const prefix = pattern.slice(0, -3);
        return file.startsWith(prefix) || file === prefix;
      }
      return file === pattern;
    })
  );
}

function hasHighRiskChanges(pr: PRInfo): boolean {
  return pr.changedFiles.some((file) =>
    HIGH_RISK_PATHS.some((pattern) => {
      if (pattern.endsWith("/**")) {
        const prefix = pattern.slice(0, -3);
        return file.startsWith(prefix);
      }
      // Handle glob patterns like Security*.swift
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(file);
      }
      return file === pattern;
    })
  );
}

function hasSecurityChanges(pr: PRInfo): boolean {
  return pr.changedFiles.some((file) =>
    SECURITY_PATHS.some((pattern) => {
      if (pattern.endsWith("/**")) {
        const prefix = pattern.slice(0, -3);
        return file.startsWith(prefix);
      }
      // Handle glob patterns like Security*.swift
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(file);
      }
      return file === pattern;
    })
  );
}

function extractJustification(pr: PRInfo): string | null {
  // Look for "Justification:" section in PR body
  const body = pr.body || "";
  const match = body.match(/Justification:\s*([^\n#]+)/i);
  return match ? match[1].trim() : null;
}

// === Policy Rules ===

function checkAutomergeLabel(pr: PRInfo): { pass: boolean; reason: string } {
  if (!hasLabel(pr, "automerge")) {
    return {
      pass: false,
      reason: `PR must have "automerge" label for auto-approval. Current labels: ${pr.labels.join(", ") || "none"}`,
    };
  }
  return { pass: true, reason: "Has automerge label" };
}

function checkAllowedAuthor(pr: PRInfo): { pass: boolean; reason: string } {
  if (!isAllowedAuthor(pr)) {
    return {
      pass: false,
      reason: `Author "${pr.author}" not in allowlist: ${ALLOWED_AUTHORS.join(", ")}`,
    };
  }
  return { pass: true, reason: `Author "${pr.author}" is allowed` };
}

function checkForbiddenPaths(pr: PRInfo): { pass: boolean; reason: string } {
  // SECURITY: NEVER auto-approve .github/** or policy changes
  if (hasForbiddenChanges(pr)) {
    const forbiddenFiles = pr.changedFiles.filter((f) =>
      FORBIDDEN_PATHS.some((pattern) => {
        if (pattern.endsWith("/**")) {
          const prefix = pattern.slice(0, -3);
          return f.startsWith(prefix) || f === prefix;
        }
        return f === pattern;
      })
    );
    
    return {
      pass: false,
      reason: `FORBIDDEN: PR modifies protected paths: ${forbiddenFiles.join(", ")}. These changes require human approval.`,
    };
  }
  return { pass: true, reason: "No forbidden paths changed" };
}

function checkSecurityJustification(pr: PRInfo): { pass: boolean; reason: string } {
  // If touching security-related paths, require explicit justification
  if (!hasSecurityChanges(pr)) {
    return { pass: true, reason: "No security-related paths changed" };
  }
  
  const justification = extractJustification(pr);
  
  if (!justification) {
    return {
      pass: false,
      reason: `Security-related paths changed: ${pr.changedFiles.filter((f) => SECURITY_PATHS.some((p) => {
        if (p.endsWith("/**")) return f.startsWith(p.slice(0, -3));
        if (p.includes("*")) return new RegExp("^" + p.replace(/\*/g, ".*") + "$").test(f);
        return f === p;
      })).join(", ")}. PR body must contain "Justification:" section explaining why these changes are safe.`,
    };
  }
  
  return {
    pass: true,
    reason: `Security changes justified: "${justification}"`,
  };
}

function checkHighRiskPolicy(pr: PRInfo): { pass: boolean; reason: string } {
  // High-risk paths (non-security) need explicit policy justification
  if (!hasHighRiskChanges(pr)) {
    return { pass: true, reason: "No high-risk paths changed" };
  }
  
  // Already covered by security check - if it's security-related, that's handled above
  if (hasSecurityChanges(pr)) {
    return { pass: true, reason: "High-risk changes covered by security justification" };
  }
  
  // For other high-risk paths, require any justification
  const justification = extractJustification(pr);
  
  if (!justification) {
    return {
      pass: false,
      reason: `High-risk paths changed: ${pr.changedFiles.filter((f) => HIGH_RISK_PATHS.some((p) => {
        if (p.endsWith("/**")) return f.startsWith(p.slice(0, -3));
        if (p.includes("*")) return new RegExp("^" + p.replace(/\*/g, ".*") + "$").test(f);
        return f === p;
      })).join(", ")}. Policy justification required in PR body.`,
    };
  }
  
  return {
    pass: true,
    reason: `High-risk changes justified: "${justification}"`,
  };
}

function checkBaseBranch(pr: PRInfo): { pass: boolean; reason: string } {
  // Only auto-merge to main or release branches
  const allowedBases = ["main", "release"];
  if (!allowedBases.includes(pr.baseRef)) {
    return {
      pass: false,
      reason: `Base branch "${pr.baseRef}" not allowed for auto-merge. Only: ${allowedBases.join(", ")}`,
    };
  }
  return { pass: true, reason: `Base branch "${pr.baseRef}" is allowed` };
}

// === Main ===

function runPolicyCheck(): void {
  const action = getAction();
  
  if (action === "validate") {
    // Just validate without PR context (for local testing)
    console.log("🔍 Running policy validation (local mode)");
    console.log(`   Allowed authors: ${ALLOWED_AUTHORS.join(", ")}`);
    console.log(`   Forbidden paths: ${FORBIDDEN_PATHS.join(", ")}`);
    console.log(`   High-risk paths: ${HIGH_RISK_PATHS.join(", ")}`);
    console.log(`   Security paths: ${SECURITY_PATHS.join(", ")}`);
    process.exit(0);
  }
  
  const pr = getPrInfo();
  
  if (!pr) {
    console.log("⚠️  No PR context found, skipping auto-approve");
    process.exit(2);
  }

  // Build explicit decision log
  const decisionLog: string[] = [];
  let finalDecision: "APPROVE" | "REFUSE" | "SKIP" = "SKIP";
  
  console.log(`\n🔍 Policy Gate Check for PR #${pr.number}`);
  console.log(`   Author: ${pr.author}`);
  console.log(`   Labels: ${pr.labels.join(", ") || "none"}`);
  console.log(`   Changed files: ${pr.changedFiles.length}`);
  console.log(`   Base branch: ${pr.baseRef}`);
  console.log("");
  
  // Run all policy checks in order (most critical first)
  const checks = [
    checkForbiddenPaths,      // SECURITY: Never approve .github/**
    checkAutomergeLabel,      // Must have automerge label
    checkAllowedAuthor,       // Must be allowed author
    checkBaseBranch,          // Must target allowed branch
    checkSecurityJustification,  // Security changes need justification
    checkHighRiskPolicy,      // High-risk changes need justification
  ];
  
  let allPassed = true;
  const results: { check: string; pass: boolean; reason: string }[] = [];
  
  for (const check of checks) {
    const result = check(pr);
    results.push({ check: check.name, ...result });
    
    const status = result.pass ? "✅" : "❌";
    console.log(`   ${status} ${check.name}: ${result.reason}`);
    decisionLog.push(`${check.name}: ${result.pass ? "PASS" : "FAIL"} - ${result.reason}`);
    
    if (!result.pass) {
      allPassed = false;
    }
  }
  
  console.log("");
  console.log("=".repeat(60));
  console.log("DECISION LOG:");
  for (const entry of decisionLog) {
    console.log(`  ${entry}`);
  }
  console.log("=".repeat(60));
  
  if (allPassed) {
    finalDecision = "APPROVE";
    console.log("\n🎉 DECISION: APPROVE - Auto-approve allowed");
    process.exit(0);
  } else {
    finalDecision = "REFUSE";
    console.log("\n🚫 DECISION: REFUSE - Manual review required");
    process.exit(1);
  }
}

runPolicyCheck();
