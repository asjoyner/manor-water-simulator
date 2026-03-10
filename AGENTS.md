# Git Workflow
   - When working br issues, commit each issue as a cohesive logical change to Git
   - git push after each commit so that the latest version is always visible on github.io

# Post Change Checks

After each change, think over these ideas like unittests and make sure they remain true before you consider a change complete.

   - Pipes should not overlap, with each other, or which other visual elements like text labels.
   - The initial defaults should be stable.  If you don't change a slider, things shouldn't change after page load.
   - Tank starting temperatures should reflect their default set point.
   - The output demand default should be less than the max optimal flow.  Warn otherwise.
   - Each output pipe should have a displayed temperature label.
   - Each stratified tank should have a temperature label for its top and bottom layer.
