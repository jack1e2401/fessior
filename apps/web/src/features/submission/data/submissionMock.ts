import type { SubmissionItem, SubmissionDetails } from "../types/submission.types";

const now = Date.now();

export const mockSubmissionItems: SubmissionItem[] = [
  {
    submissionId: "s_1",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48, // 1.02 MB
    createdAt: now - 12000, // 12 seconds ago (Just now)
    username: "Khoidesu"
  },
  {
    submissionId: "s_2",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 35000, // 35 seconds ago (Just now)
    username: "Khoidesu"
  },
  {
    submissionId: "s_3",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 59000, // 59 seconds ago (Just now)
    username: "Khoidesu"
  },
  {
    submissionId: "s_4",
    problemId: "add-two-numbers",
    problemTitle: "2. Add Two Numbers",
    status: "wrong_answer",
    language: "python",
    time: 0.045,
    memory: 8192, // 8mb
    createdAt: now - 5 * 60 * 1000, // 5 mins ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_5",
    problemId: "longest-substring",
    problemTitle: "3. Longest Substring Without Repeating Characters",
    status: "time_limit_exceeded",
    language: "java",
    time: 2.05,
    memory: 16384, // 16mb
    createdAt: now - 45 * 60 * 1000, // 45 mins ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_6",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 3 * 3600 * 1000, // 3 hours ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_7",
    problemId: "median-sorted-arrays",
    problemTitle: "4. Median of Two Sorted Arrays",
    status: "compile_error",
    language: "go",
    time: 0.0,
    memory: 0,
    createdAt: now - 8 * 3600 * 1000, // 8 hours ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_8",
    problemId: "palindrome-string",
    problemTitle: "5. Palindrome String",
    status: "accepted",
    language: "javascript",
    time: 0.082,
    memory: 4096, // 4mb
    createdAt: now - 24 * 3600 * 1000, // 1 day ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_9",
    problemId: "zigzag-conversion",
    problemTitle: "6. Zigzag Conversion",
    status: "memory_limit_exceeded",
    language: "rust",
    time: 0.125,
    memory: 262144, // 256mb
    createdAt: now - 36 * 3600 * 1000, // 1.5 days ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_10",
    problemId: "reverse-integer",
    problemTitle: "7. Reverse Integer",
    status: "runtime_error",
    language: "python",
    time: 0.012,
    memory: 3072, // 3mb
    createdAt: now - 48 * 3600 * 1000, // 2 days ago
    username: "Khoidesu"
  },
  {
    submissionId: "s_11",
    problemId: "string-to-integer",
    problemTitle: "8. String to Integer (atoi)",
    status: "accepted",
    language: "cpp",
    time: 0.008,
    memory: 1200,
    createdAt: now - 52 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_12",
    problemId: "palindrome-number",
    problemTitle: "9. Palindrome Number",
    status: "accepted",
    language: "java",
    time: 0.015,
    memory: 4200,
    createdAt: now - 60 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_13",
    problemId: "regular-expression",
    problemTitle: "10. Regular Expression Matching",
    status: "wrong_answer",
    language: "rust",
    time: 0.024,
    memory: 2048,
    createdAt: now - 72 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_14",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "python",
    time: 0.038,
    memory: 6144,
    createdAt: now - 80 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_15",
    problemId: "add-two-numbers",
    problemTitle: "2. Add Two Numbers",
    status: "accepted",
    language: "go",
    time: 0.005,
    memory: 1100,
    createdAt: now - 96 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_16",
    problemId: "longest-substring",
    problemTitle: "3. Longest Substring Without Repeating Characters",
    status: "accepted",
    language: "javascript",
    time: 0.052,
    memory: 3800,
    createdAt: now - 110 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_17",
    problemId: "median-sorted-arrays",
    problemTitle: "4. Median of Two Sorted Arrays",
    status: "compile_error",
    language: "cpp",
    time: 0.0,
    memory: 0,
    createdAt: now - 120 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_18",
    problemId: "palindrome-string",
    problemTitle: "5. Palindrome String",
    status: "time_limit_exceeded",
    language: "java",
    time: 2.10,
    memory: 32768,
    createdAt: now - 130 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_19",
    problemId: "zigzag-conversion",
    problemTitle: "6. Zigzag Conversion",
    status: "accepted",
    language: "python",
    time: 0.028,
    memory: 5900,
    createdAt: now - 140 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_20",
    problemId: "reverse-integer",
    problemTitle: "7. Reverse Integer",
    status: "accepted",
    language: "cpp",
    time: 0.003,
    memory: 1024,
    createdAt: now - 150 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_21",
    problemId: "string-to-integer",
    problemTitle: "8. String to Integer (atoi)",
    status: "accepted",
    language: "go",
    time: 0.012,
    memory: 1500,
    createdAt: now - 160 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_22",
    problemId: "palindrome-number",
    problemTitle: "9. Palindrome Number",
    status: "runtime_error",
    language: "python",
    time: 0.010,
    memory: 3000,
    createdAt: now - 170 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_23",
    problemId: "regular-expression",
    problemTitle: "10. Regular Expression Matching",
    status: "accepted",
    language: "javascript",
    time: 0.042,
    memory: 3500,
    createdAt: now - 180 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_24",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.002,
    memory: 950,
    createdAt: now - 190 * 3600 * 1000,
    username: "Khoidesu"
  },
  {
    submissionId: "s_25",
    problemId: "add-two-numbers",
    problemTitle: "2. Add Two Numbers",
    status: "accepted",
    language: "rust",
    time: 0.009,
    memory: 1048,
    createdAt: now - 200 * 3600 * 1000,
    username: "Khoidesu"
  }
];

export const mockSubmissionDetails: Record<string, SubmissionDetails> = {
  s_1: {
    submissionId: "s_1",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 12000,
    username: "Khoidesu",
    codeSnippet: `#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> m;\n        for (int i = 0; i < nums.size(); ++i) {\n            if (m.count(target - nums[i])) {\n                return {m[target - nums[i]], i};\n            }\n            m[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 2, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 3, verdict: "accepted", time: 0.002, memory: 1044.48 }
    ]
  },
  s_2: {
    submissionId: "s_2",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 35000,
    username: "Khoidesu",
    codeSnippet: `#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (seen.find(complement) != seen.end()) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 2, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 3, verdict: "accepted", time: 0.002, memory: 1044.48 }
    ]
  },
  s_3: {
    submissionId: "s_3",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 59000,
    username: "Khoidesu",
    codeSnippet: `// Same as above, C++ solution`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 2, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 3, verdict: "accepted", time: 0.002, memory: 1044.48 }
    ]
  },
  s_4: {
    submissionId: "s_4",
    problemId: "add-two-numbers",
    problemTitle: "2. Add Two Numbers",
    status: "wrong_answer",
    language: "python",
    time: 0.045,
    memory: 8192,
    createdAt: now - 5 * 60 * 1000,
    username: "Khoidesu",
    codeSnippet: `class Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        # Incorrect implementation producing WRONG ANSWER\n        curr = dummy = ListNode(0)\n        carry = 0\n        while l1 or l2:\n            val = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry\n            carry = val // 10\n            curr.next = ListNode(val % 10)\n            curr = curr.next\n            # Missing moving list pointer causing WA\n        return dummy.next`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.010, memory: 4096 },
      { caseId: 2, verdict: "wrong_answer", time: 0.015, memory: 4096 },
      { caseId: 3, verdict: "wrong_answer", time: 0.020, memory: 8192 }
    ]
  },
  s_5: {
    submissionId: "s_5",
    problemId: "longest-substring",
    problemTitle: "3. Longest Substring Without Repeating Characters",
    status: "time_limit_exceeded",
    language: "java",
    time: 2.05,
    memory: 16384,
    createdAt: now - 45 * 60 * 1000,
    username: "Khoidesu",
    codeSnippet: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // O(N^3) algorithm causing TLE\n        int n = s.length();\n        int ans = 0;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j <= n; j++) {\n                if (allUnique(s, i, j)) ans = Math.max(ans, j - i);\n            }\n        }\n        return ans;\n    }\n\n    public boolean allUnique(String s, int start, int end) {\n        Set<Character> set = new HashSet<>();\n        for (int i = start; i < end; i++) {\n            Character ch = s.charAt(i);\n            if (set.contains(ch)) return false;\n            set.add(ch);\n        }\n        return true;\n    }\n}`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.05, memory: 8192 },
      { caseId: 2, verdict: "accepted", time: 0.12, memory: 8192 },
      { caseId: 3, verdict: "time_limit_exceeded", time: 2.05, memory: 16384 }
    ]
  },
  s_6: {
    submissionId: "s_6",
    problemId: "two-sum",
    problemTitle: "1. Two Sum",
    status: "accepted",
    language: "cpp",
    time: 0.004,
    memory: 1044.48,
    createdAt: now - 3 * 3600 * 1000,
    username: "Khoidesu",
    codeSnippet: `// Acceptable solution`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.001, memory: 512 },
      { caseId: 2, verdict: "accepted", time: 0.001, memory: 512 }
    ]
  },
  s_7: {
    submissionId: "s_7",
    problemId: "median-sorted-arrays",
    problemTitle: "4. Median of Two Sorted Arrays",
    status: "compile_error",
    language: "go",
    time: 0.0,
    memory: 0,
    createdAt: now - 8 * 3600 * 1000,
    username: "Khoidesu",
    codeSnippet: `package main\n\nfunc findMedianSortedArrays(nums1 []int, nums2 []int) float64 {\n    // syntax error: missing return type/value\n    result := 0.0\n}`,
    tests: []
  },
  s_8: {
    submissionId: "s_8",
    problemId: "palindrome-string",
    problemTitle: "5. Palindrome String",
    status: "accepted",
    language: "javascript",
    time: 0.082,
    memory: 4096,
    createdAt: now - 24 * 3600 * 1000,
    username: "Khoidesu",
    codeSnippet: `/**\n * @param {string} s\n * @return {string}\n */\nvar longestPalindrome = function(s) {\n    if (!s || s.length < 1) return "";\n    let start = 0, end = 0;\n    for (let i = 0; i < s.length; i++) {\n        let len1 = expandAroundCenter(s, i, i);\n        let len2 = expandAroundCenter(s, i, i + 1);\n        let len = Math.max(len1, len2);\n        if (len > end - start) {\n            start = i - Math.floor((len - 1) / 2);\n            end = i + Math.floor(len / 2);\n        }\n    }\n    return s.substring(start, end + 1);\n};\n\nfunction expandAroundCenter(s, left, right) {\n    while (left >= 0 && right < s.length && s[left] === s[right]) {\n        left--;\n        right++;\n    }\n    return right - left - 1;\n}`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.010, memory: 1024 },
      { caseId: 2, verdict: "accepted", time: 0.035, memory: 2048 },
      { caseId: 3, verdict: "accepted", time: 0.037, memory: 4096 }
    ]
  },
  s_9: {
    submissionId: "s_9",
    problemId: "zigzag-conversion",
    problemTitle: "6. Zigzag Conversion",
    status: "memory_limit_exceeded",
    language: "rust",
    time: 0.125,
    memory: 262144, // 256 MB
    createdAt: now - 36 * 3600 * 1000,
    username: "Khoidesu",
    codeSnippet: `impl Solution {\n    pub fn convert(s: String, num_rows: i32) -> String {\n        // Infinite allocation causing Memory Limit Exceeded\n        let mut vec = Vec::new();\n        loop {\n            vec.push(s.clone());\n        }\n    }\n}`,
    tests: [
      { caseId: 1, verdict: "accepted", time: 0.005, memory: 1024 },
      { caseId: 2, verdict: "memory_limit_exceeded", time: 0.120, memory: 262144 }
    ]
  },
  s_10: {
    submissionId: "s_10",
    problemId: "reverse-integer",
    problemTitle: "7. Reverse Integer",
    status: "runtime_error",
    language: "python",
    time: 0.012,
    memory: 3072,
    createdAt: now - 48 * 3600 * 1000,
    username: "Khoidesu",
    codeSnippet: `class Solution:\n    def reverse(self, x: int) -> int:\n        # ZeroDivisionError causing Runtime Error\n        res = x / 0\n        return int(res)`,
    tests: [
      { caseId: 1, verdict: "runtime_error", time: 0.012, memory: 3072 }
    ]
  }
};

// Auto-generate details for s_11 to s_25 if they are clicked
for (let i = 11; i <= 25; i++) {
  const item = mockSubmissionItems.find(x => x.submissionId === `s_${i}`);
  if (item) {
    mockSubmissionDetails[`s_${i}`] = {
      ...item,
      codeSnippet: `// Demo code snippet for ${item.problemTitle} in ${item.language}\n// Submission ID: ${item.submissionId}\n\n// Full code goes here...`,
      tests: item.status !== "compile_error" ? [
        { caseId: 1, verdict: "accepted", time: item.time / 2, memory: item.memory / 2 },
        { caseId: 2, verdict: item.status, time: item.time, memory: item.memory }
      ] : []
    };
  }
}
