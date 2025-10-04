import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Fuse from 'fuse.js';
import type { ProjectInfo } from './scanner';
import type { RecentDirectory } from './config';
import { formatTimeAgo } from './scanner';

interface AppProps {
  projects: ProjectInfo[];
  recentDirs: RecentDirectory[];
  onSelect: (project: ProjectInfo) => void;
  onCancel: () => void;
  onCreate: () => void;
}

const COL_SELECTOR = 4;
const COL_NAME = 50;
const COL_TIME = 18;
const TOTAL_WIDTH = COL_SELECTOR + COL_NAME + COL_TIME + 4; // +4 for borders

function padRight(str: string, length: number): string {
  return str.length >= length ? str.substring(0, length) : str + ' '.repeat(length - str.length);
}

function padLeft(str: string, length: number): string {
  return str.length >= length ? str.substring(0, length) : ' '.repeat(length - str.length) + str;
}

const VISIBLE_ROWS = 15;

export function App({ projects, recentDirs, onSelect, onCancel, onCreate }: AppProps) {
  const { exit } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Create a map of recent paths for quick lookup
  const recentPaths = new Set(recentDirs.map(r => r.path));

  // Separate and sort projects
  const recentProjects = projects.filter(p => recentPaths.has(p.path));
  const otherProjects = projects.filter(p => !recentPaths.has(p.path));

  recentProjects.sort((a, b) => {
    const aTime = recentDirs.find(r => r.path === a.path)?.accessedAt || 0;
    const bTime = recentDirs.find(r => r.path === b.path)?.accessedAt || 0;
    return bTime - aTime;
  });

  const orderedProjects = [...recentProjects, ...otherProjects];

  // Fuzzy search - include parent directory for subdirectories
  const searchableProjects = orderedProjects.map(p => ({
    ...p,
    searchName: p.isSubdirectory && p.parentDir ? `${p.parentDir}/${p.name}` : p.name,
  }));

  const fuse = new Fuse(searchableProjects, {
    keys: ['searchName', 'name', 'path'],
    threshold: 0.3,
    includeScore: true,
  });

  const filteredProjects: ProjectInfo[] = searchQuery
    ? fuse.search(searchQuery).map(result => {
        const { searchName, ...project } = result.item;
        return project as ProjectInfo;
      })
    : orderedProjects;

  // Add "Create new" option
  const allOptions = [...filteredProjects, null]; // null represents "Create new"
  const maxIndex = allOptions.length - 1;

  // Calculate visible slice based on scroll offset
  const visibleProjects = filteredProjects.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + VISIBLE_ROWS < filteredProjects.length;

  // Reset selection and scroll when filtered results change
  useEffect(() => {
    if (selectedIndex > maxIndex) {
      setSelectedIndex(maxIndex >= 0 ? maxIndex : 0);
    }
    setScrollOffset(0);
  }, [searchQuery]);

  // Update scroll offset when selection changes
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      // Scrolling up
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + VISIBLE_ROWS) {
      // Scrolling down
      setScrollOffset(selectedIndex - VISIBLE_ROWS + 1);
    }
  }, [selectedIndex, scrollOffset]);

  useInput((input, key) => {
    if (isSearchFocused) {
      if (key.escape) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          onCancel();
          exit();
        }
      } else if (key.downArrow || key.tab) {
        setIsSearchFocused(false);
        setSelectedIndex(0);
      } else if (key.return && filteredProjects.length > 0) {
        // If only one result, select it immediately
        if (filteredProjects.length === 1 && filteredProjects[0]) {
          onSelect(filteredProjects[0]);
          exit();
        } else {
          setIsSearchFocused(false);
          setSelectedIndex(0);
        }
      }
    } else {
      if (key.escape) {
        setIsSearchFocused(true);
      } else if (key.upArrow) {
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        } else {
          setIsSearchFocused(true);
        }
      } else if (key.downArrow) {
        if (selectedIndex < maxIndex) {
          setSelectedIndex(selectedIndex + 1);
        }
      } else if (key.return) {
        const selected = allOptions[selectedIndex];
        if (selected === null) {
          onCreate();
          exit();
        } else if (selected) {
          onSelect(selected);
          exit();
        }
      } else if (input) {
        // Start typing - go back to search
        setIsSearchFocused(true);
        setSearchQuery(searchQuery + input);
      }
    }
  });

  const tableInnerWidth = COL_SELECTOR + COL_NAME + COL_TIME + 2; // +2 for column separators

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">KAI PROJECT SEARCH</Text>
      </Box>

      {/* Table */}
      <Box flexDirection="column">
        {/* Top border */}
        <Text dimColor>┌{'─'.repeat(tableInnerWidth)}┐</Text>

        {/* Search row spanning all columns */}
        <Box>
          <Text dimColor>│ Search: </Text>
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder=""
            focus={isSearchFocused}
          />
          {/* Padding to push the right border to the edge - accounting for cursor */}
          <Text>{' '.repeat(Math.max(0, tableInnerWidth - 10 - searchQuery.length))}</Text>
          <Text dimColor>│</Text>
        </Box>

        {/* Separator after search */}
        <Text dimColor>├{'─'.repeat(COL_SELECTOR)}┬{'─'.repeat(COL_NAME)}┬{'─'.repeat(COL_TIME)}┤</Text>

        {/* Header row */}
        <Text dimColor>
          │{padRight('', COL_SELECTOR)}│{padRight(' Project', COL_NAME)}│{padRight(' Last Modified', COL_TIME)}│
        </Text>

        {/* Header separator */}
        <Text dimColor>├{'─'.repeat(COL_SELECTOR)}┼{'─'.repeat(COL_NAME)}┼{'─'.repeat(COL_TIME)}┤</Text>

        {/* Scroll indicator - more above */}
        {hasMoreAbove && (
          <Text dimColor>│{padRight('    ↑ More above...', tableInnerWidth)}│</Text>
        )}

        {/* Directory rows */}
        {filteredProjects.length === 0 && searchQuery ? (
          <>
            <Text dimColor>│{padRight('  No directories found', TOTAL_WIDTH - 2)}│</Text>
            <Text dimColor>└{'─'.repeat(COL_SELECTOR)}┴{'─'.repeat(COL_NAME)}┴{'─'.repeat(COL_TIME)}┘</Text>
          </>
        ) : (
          <>
            {visibleProjects.map((project, visibleIndex) => {
              const actualIndex = scrollOffset + visibleIndex;
              const isSelected = !isSearchFocused && selectedIndex === actualIndex;
              const selector = isSelected ? ' >' : '  ';
              const timeAgo = formatTimeAgo(project.lastModified);

              // Display format for subdirectories: parent/subdirectory
              const displayName = project.isSubdirectory && project.parentDir
                ? `${project.parentDir}/${project.name}`
                : project.name;

              return (
                <Box key={project.path}>
                  <Text dimColor>│</Text>
                  <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                    {padRight(selector, COL_SELECTOR)}
                  </Text>
                  <Text dimColor>│ </Text>
                  {project.isSubdirectory && project.parentDir ? (
                    <>
                      <Text dimColor color={isSelected ? 'cyan' : undefined}>
                        {project.parentDir}/
                      </Text>
                      <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                        {project.name}
                      </Text>
                      <Text>{' '.repeat(Math.max(0, COL_NAME - displayName.length - 1))}</Text>
                    </>
                  ) : (
                    <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                      {padRight(project.name, COL_NAME - 1)}
                    </Text>
                  )}
                  <Text dimColor>│</Text>
                  <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                    {padRight(` ${timeAgo}`, COL_TIME)}
                  </Text>
                  <Text dimColor>│</Text>
                </Box>
              );
            })}

            {/* Scroll indicator - more below */}
            {hasMoreBelow && (
              <Text dimColor>│{padRight('    ↓ More below...', tableInnerWidth)}│</Text>
            )}

            {/* Create new separator */}
            <Text dimColor>├{'─'.repeat(COL_SELECTOR)}┼{'─'.repeat(COL_NAME)}┼{'─'.repeat(COL_TIME)}┤</Text>

            {/* Create new option */}
            <Text 
              color={!isSearchFocused && selectedIndex === maxIndex ? 'cyan' : 'green'}
              bold={!isSearchFocused && selectedIndex === maxIndex}
            >
              │{padRight(!isSearchFocused && selectedIndex === maxIndex ? ' >' : '  ', COL_SELECTOR)}│{padRight(' + Create new', COL_NAME)}│{padRight('', COL_TIME)}│
            </Text>

            {/* Bottom border */}
            <Text dimColor>└{'─'.repeat(COL_SELECTOR)}┴{'─'.repeat(COL_NAME)}┴{'─'.repeat(COL_TIME)}┘</Text>
          </>
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          ↑↓: Navigate   Enter: Select   ESC: Cancel
        </Text>
      </Box>
    </Box>
  );
}
