# Main Git Commands

This document lists the most commonly used Git commands, organized by category.

## Basic Workflow

*   **`git init`:**
    *   **Purpose:** Initializes a new Git repository in the current directory.
    *   **Use:** Start tracking changes in a new project.
    *   **git init is used only once in the lifetime of a project's Git repository**. You do not need to use it again when creating new branches.
git init is like the birth of your project's Git repository. It initializes the .git directory, which is the hidden folder where Git stores all the version control information for your project.
This only needs to happen once, at the very beginning, when you decide to start tracking changes with Git in a project.
After this command, the folder is under version control, so git commands can be used.
*   **`git clone <repository_url>`:**
    *   **Purpose:** Creates a copy of a remote Git repository on your local machine.
    *   **Use:** Get a project from a service like GitHub or GitLab.
*   **`git add <file>` or `git add .`:**
    *   **Purpose:** Stages changes to be included in your next commit. `git add .` stages all changes in the current directory and its subdirectories.
    *   **Use:** Prepare changes to be committed.
*   **`git commit -m "Your descriptive message"`:**
    *   **Purpose:** Creates a snapshot of the staged changes. The message should describe what changes you made.
    *   **Use:** Save changes with a descriptive message.
*   **`git status`:**
    *   **Purpose:** Shows the current state of your working directory.
    *   **Use:** Check which files have been modified, staged, or are untracked.
*   **`git log`:**
    *   **Purpose:** Shows the commit history of the current branch.
    * **Use:** Show the history of commits

## Branching and Merging

*   **`git branch`:**
    *   **Purpose:** Lists all branches, with an asterisk (*) next to the active branch.
    *   **Use:** See available branches.
*   **`git branch <branch_name>`:**
    *   **Purpose:** Creates a new branch with the given name.
    *   **Use:** Start working on a new feature or bug fix.
*   **`git checkout <branch_name>` or `git switch <branch_name>`:**
    *   **Purpose:** Switches to the specified branch. `git switch` is the newer, recommended command.
    *   **Use:** Change to a different line of development.
*   **`git checkout -b <branch_name>`:**
    *   **Purpose:** Creates a new branch and immediately switches to it.
    *   **Use:** Quickly create and switch to a new branch.
*   **`git merge <branch_name>`:**
    *   **Purpose:** Merges the specified branch into your current branch.
    *   **Use:** Combine changes from different branches.
    *   **example** You are currently on a branch named 'development'.
There's another branch named main.
You run the command git merge main. Merge Operation: Git attempts to integrate the changes from the main branch into the 'development' branch.

## Remote Repositories

*   **`git remote add origin <repository_url>`:**
    *   **Purpose:** Adds a remote repository. "origin" is the common name for the main remote.
    *   **Use:** Connect your local project to a remote.
*   **`git remote -v`:**
    *   **Purpose:** Lists remote repositories and their URLs.
    *   **Use:** Check your remote connections.
*   **`git push -u origin <branch_name>` or `git push origin <branch_name>`:**
    *   **Purpose:** Pushes your local branch to the remote repository. `-u` sets up tracking.
    *   **Use:** Upload local commits to a remote branch.
*   **`git pull`:**
    *   **Purpose:** Fetches changes from the remote repository and merges them into your current branch.
    *   **Use:** Download and integrate remote changes.

## Undoing Changes

*   **`git checkout -- <file>`:**
    *   **Purpose:** Discards local changes in a specific file, reverting it to the last committed version.
    *   **Use:** Undo changes in a file.
*   **`git reset --hard <commit-hash>`**
    *   **Purpose:** Revert to a previous commit. **USE WITH CAUTION**, this deletes all subsequent commits.
    * **Use:** Delete following commits
* **`git reset <file>`:**
    * **Purpose:** Unstages a file. It removes the file from the "to be commited" staging.
    * **Use:** Remove a file from the commit.
* **`git revert <commit_hash>`**
    * **Purpose:** creates a new commit that undoes the changes in the specified commit
    * **Use:** Undo a commit

## Other Useful Commands

* **`git diff`:**
    * **Purpose:** Shows the differences between your working directory and the last commit, or between the staging area and the last commit.
    * **Use:** See the changes you have done.
* **`git show <commit-hash>`**
    * **Purpose:** Shows the changes introduced by a given commit
    * **Use:** See the changes of a specific commit.
* **`git stash`**
    * **Purpose:** Temporarily saves your changes without committing.
    * **Use:** Save current changes.
* **`git stash pop`**
    * **Purpose:** Re-applies the last stash saved.
    * **Use:** Reapply saved changes.
* **`git stash list`**
    * **Purpose:** Shows the stash list.
    * **Use:** Show stashed changes.

## Key Concepts

*   **Working Directory:** Your local project folder.
*   **Staging Area:** A temporary area where you prepare changes for a commit.
*   **Local Repository:** The `.git` folder in your project.
*   **Remote Repository:** A copy of your project hosted on a server.
* **Commit:** A snapshot of the changes at a specific point in time.
* **Branch:** A pointer to a specific commit, allowing parallel development.
* **Push:** Upload local commits to a remote repository.
* **Pull:** Download remote commits to your local repository.
* **Merge:** Combine changes from one branch into another.
