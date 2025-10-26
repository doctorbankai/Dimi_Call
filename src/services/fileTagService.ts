// File Tag Service - Placeholder for tag management

import { FileNode } from '@/types/fileManager';

const TAGS_STORAGE_KEY = 'dimicall-file-tags';

interface FileTagsData {
  [fileId: string]: string[];
}

/**
 * Get all tags from localStorage
 */
function getAllTags(): FileTagsData {
  try {
    const data = localStorage.getItem(TAGS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load tags:', error);
    return {};
  }
}

/**
 * Save all tags to localStorage
 */
function saveTags(tags: FileTagsData): void {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
  } catch (error) {
    console.error('Failed to save tags:', error);
  }
}

/**
 * Add a tag to a file
 */
export function addTag(fileId: string, tag: string): void {
  const tags = getAllTags();
  
  if (!tags[fileId]) {
    tags[fileId] = [];
  }
  
  if (!tags[fileId].includes(tag)) {
    tags[fileId].push(tag);
    saveTags(tags);
  }
}

/**
 * Remove a tag from a file
 */
export function removeTag(fileId: string, tag: string): void {
  const tags = getAllTags();
  
  if (tags[fileId]) {
    tags[fileId] = tags[fileId].filter(t => t !== tag);
    
    if (tags[fileId].length === 0) {
      delete tags[fileId];
    }
    
    saveTags(tags);
  }
}

/**
 * Get all tags for a file
 */
export function getTags(fileId: string): string[] {
  const tags = getAllTags();
  return tags[fileId] || [];
}

/**
 * Get all files with a specific tag
 */
export function getFilesByTag(tag: string): string[] {
  const tags = getAllTags();
  const fileIds: string[] = [];
  
  for (const [fileId, fileTags] of Object.entries(tags)) {
    if (fileTags.includes(tag)) {
      fileIds.push(fileId);
    }
  }
  
  return fileIds;
}

/**
 * Get all unique tags across all files
 */
export function getAllUniqueTags(): string[] {
  const tags = getAllTags();
  const uniqueTags = new Set<string>();
  
  for (const fileTags of Object.values(tags)) {
    fileTags.forEach(tag => uniqueTags.add(tag));
  }
  
  return Array.from(uniqueTags).sort();
}

/**
 * Get tag usage count
 */
export function getTagUsageCount(tag: string): number {
  const tags = getAllTags();
  let count = 0;
  
  for (const fileTags of Object.values(tags)) {
    if (fileTags.includes(tag)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Delete a tag from all files
 */
export function deleteTag(tag: string): void {
  const tags = getAllTags();
  
  for (const fileId in tags) {
    tags[fileId] = tags[fileId].filter(t => t !== tag);
    
    if (tags[fileId].length === 0) {
      delete tags[fileId];
    }
  }
  
  saveTags(tags);
}

/**
 * Rename a tag across all files
 */
export function renameTag(oldTag: string, newTag: string): void {
  const tags = getAllTags();
  
  for (const fileId in tags) {
    const index = tags[fileId].indexOf(oldTag);
    if (index !== -1) {
      tags[fileId][index] = newTag;
    }
  }
  
  saveTags(tags);
}
