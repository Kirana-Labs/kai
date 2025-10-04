import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

export interface ProjectInfo {
  name: string;
  path: string;
  isProject: boolean;
  hasSubdirs: boolean;
  lastModified: number;
  projectType?: string;
  parentDir?: string; // For subdirectories, the parent directory name
  isSubdirectory?: boolean; // Whether this is a subdirectory of another folder
}

// Project indicators - files/folders that indicate a project
const PROJECT_INDICATORS = [
  'package.json',
  'pom.xml',
  'Cargo.toml',
  'go.mod',
  'requirements.txt',
  'Gemfile',
  'composer.json',
  '.git',
  'Makefile',
  'CMakeLists.txt',
  'build.gradle',
  'pyproject.toml',
  'deno.json',
  'bun.lock',
];

export function isProjectDirectory(dirPath: string): { isProject: boolean; type?: string } {
  try {
    const files = readdirSync(dirPath);
    
    for (const indicator of PROJECT_INDICATORS) {
      if (files.includes(indicator)) {
        return { isProject: true, type: indicator };
      }
    }
    
    return { isProject: false };
  } catch (error) {
    return { isProject: false };
  }
}

export function hasSubdirectories(dirPath: string): boolean {
  try {
    const items = readdirSync(dirPath);
    return items.some(item => {
      try {
        const itemPath = join(dirPath, item);
        const stat = statSync(itemPath);
        return stat.isDirectory() && !item.startsWith('.');
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function scanDirectory(dirPath: string, includeHidden = false): ProjectInfo[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  try {
    const items = readdirSync(dirPath);
    const directories: ProjectInfo[] = [];

    for (const item of items) {
      if (!includeHidden && item.startsWith('.')) {
        continue;
      }

      const itemPath = join(dirPath, item);
      
      try {
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          const { isProject, type } = isProjectDirectory(itemPath);
          const hasSubdirs = hasSubdirectories(itemPath);
          
          // Add the directory itself
          directories.push({
            name: item,
            path: itemPath,
            isProject,
            hasSubdirs,
            lastModified: stat.mtimeMs,
            projectType: type,
            isSubdirectory: false,
          });

          // Scan subdirectories for git repositories
          if (hasSubdirs) {
            const subdirs = scanSubdirectoriesForGit(itemPath, item);
            directories.push(...subdirs);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
        continue;
      }
    }

    // Sort by name alphabetically (like most file browsers)
    return directories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

function scanSubdirectoriesForGit(parentPath: string, parentName: string): ProjectInfo[] {
  const gitProjects: ProjectInfo[] = [];
  
  try {
    const items = readdirSync(parentPath);
    
    for (const item of items) {
      if (item.startsWith('.')) {
        continue;
      }

      const itemPath = join(parentPath, item);
      
      try {
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Check if this subdirectory has a .git folder
          const gitPath = join(itemPath, '.git');
          if (existsSync(gitPath)) {
            const { isProject, type } = isProjectDirectory(itemPath);
            const hasSubdirs = hasSubdirectories(itemPath);
            
            gitProjects.push({
              name: item,
              path: itemPath,
              isProject: true,
              hasSubdirs,
              lastModified: stat.mtimeMs,
              projectType: type || '.git',
              parentDir: parentName,
              isSubdirectory: true,
            });
          }
        }
      } catch (error) {
        // Skip inaccessible directories
        continue;
      }
    }
  } catch (error) {
    // Skip if we can't read the parent directory
  }
  
  return gitProjects;
}

export function getAllProjects(rootPath: string, maxDepth = 3): ProjectInfo[] {
  const allProjects: ProjectInfo[] = [];
  
  function scan(path: string, depth: number) {
    if (depth > maxDepth) return;
    
    const projects = scanDirectory(path);
    
    for (const project of projects) {
      allProjects.push(project);
      
      // If it's not a project itself but has subdirectories, scan deeper
      if (!project.isProject && project.hasSubdirs) {
        scan(project.path, depth + 1);
      }
    }
  }
  
  scan(rootPath, 0);
  return allProjects;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
