import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";
import { ALL_SUBJECTS, Subject } from "@/constants/grade-subjects";

/**
 * Generic type to convert PascalCase to camelCase
 */
export type PascalToCamelCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Rest}`
  : S;

/**
 * Generic type to convert space-separated string to camelCase
 */
export type SpacesToCamelCase<S extends string> = S extends `${infer First} ${infer Rest}`
  ? `${Lowercase<First>}${SpacesToCamelCase<Rest>}`
  : Lowercase<S>;

/**
 * Type for status filter keys
 */
export type StatusFilterKeys = {
  [K in AssignmentStatus as PascalToCamelCase<K>]: boolean;
};

/**
 * Type for subject filter keys
 */
export type SubjectFilterKeys = {
  [K in Subject as SpacesToCamelCase<K>]: boolean;
};

/**
 * Type guard to check if a value is a valid status
 */
export function isValidStatus(value: string): value is AssignmentStatus {
  return Object.values(ASSIGNMENT_STATUS).includes(value as AssignmentStatus);
}

/**
 * Type guard to check if a value is a valid subject
 */
export function isValidSubject(value: string): value is Subject {
  return Object.values(ALL_SUBJECTS).includes(value as Subject);
} 