#!/usr/bin/env bun
/**
 * Policy Gate Script
 * 
 * Validates PRs against defined policy rules before auto-approval.
 * This is the "why" layer - machine-verifiable justification for approvals.
 * 
 * Usage: bun .github/scripts/policy-gate.ts
 * 
 * Exit codes:
 *   0 = Policy passes, approval allowed
 *   1 = Policy fails, approval denied
 *   2 = Skip auto-approve (needs manual review)
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

// === Configuration ===

const ALLOWED_AUTHORS = ["DanFashauer", "kilo-code-bot[bot]"];
const HIGH_RISK_PATHS = [
  ".github/workflows/**",
  "src/app/api/**",
  "src/lib/backend/validation.ts",
  "ios/EnterpriseShell/Services/SecurityManager.swift",
  "ios/EnterpriseShell/Services/OIDCAuthService.swift",
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
    const output = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only origin/main...HEAD 2>/dev/null || echo ""', {
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
    const prJson = execSync(`gh pr view ${prNumber} --json title,body,author,labels,baseRef,headRef`, {
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
      baseRef: pr.baseRef || "main",
      headRef: pr.headRef || "unknown",
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

function hasHighRiskChanges(pr: PRInfo): boolean {
  return pr.changedFiles.some((file) =>
    HIGH_RISK_PATHS.some((pattern) => {
      if (pattern.endsWith("/**")) {
        const prefix = pattern.slice(0, -3);
        return file.startsWith(prefix);
      }
      return file === pattern;
    })
  );
}

function extractPolicyFromBody(pr: PRInfo): string[] {
  // Look for policy justification in PR body
  // Format: "Policy: <explanation>" or "Why: <explanation>"
  const patterns = [
    /Policy:\s*(.+)/gi,
    /Why:\s*(.+)/gi,
    /Rationale:\s*(.+)/gi,
  ];
  
  const justifications: string[] = [];
  const body = pr.body + pr.title;
  
  for (const pattern of patterns) {
    const matches = body.match(pattern);
    if (matches) {
      justifications.push(...matches);
    }
  }
  
  return justifications;
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

function checkHighRiskPolicy(pr: PRInfo): { pass: boolean; reason: string } {
  if (!hasHighRiskChanges(pr)) {
    return { pass: true, reason: "No high-risk paths changed" };
  }
  
  // High-risk paths need explicit policy justification
  const justifications = extractPolicyFromBody(pr);
  
  if (justifications.length === 0) {
    return {
      pass: false,
      reason: `High-risk paths changed: ${pr.changedFiles.filter((f) => HIGH_RISK_PATHS.some((p) => f.startsWith(p.slice(0, -3)))).join(", ")}. Policy justification required in PR body.`,
    };
  }
  
  return {
    pass: true,
    reason: `High-risk changes justified: ${justifications.join("; ")}`,
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
    console.log(`   High-risk paths: ${HIGH_RISK_PATHS.join(", ")}`);
    process.exit(0);
  }
  
  const pr = getPrInfo();
  
  if (!pr) {
    console.log("⚠️  No PR context found, skipping auto-approve");
    process.exit(2);
  }
  
  console.log(`\n🔍 Policy Gate Check for PR #${pr.number}`);
  console.log(`   Author: ${pr.author}`);
  console.log(`   Labels: ${pr.labels.join(", ") || "none"}`);
  console.log(`   Changed files: ${pr.changedFiles.length}`);
  console.log("");
  
  // Run all policy checks
  const checks = [
    checkAutomergeLabel,
    checkAllowedAuthor,
    checkBaseBranch,
    checkHighRiskPolicy,
  ];
  
  let allPassed = true;
  const results: { check: string; pass: boolean; reason: string }[] = [];
  
  for (const check of checks) {
    const result = check(pr);
    results.push({ check: check.name, ...result });
    
    const status = result.pass ? "✅" : "❌";
    console.log(`   ${status} ${check.name}: ${result.reason}`);
    
    if (!result.pass) {
      allPassed = false;
    }
  }
  
  console.log("");
  
  if (allPassed) {
    console.log("🎉 Policy PASSED - auto-approve allowed");
    process.exit(0);
  } else {
    console.log("🚫 Policy FAILED - manual review required");
    process.exit(1);
  }
}

runPolicyCheck();
