#!/bin/bash

# Name of the tmux session
SESSION="maidsofhonor"

# 1. Check if the session already exists. If it does, just attach to it.
tmux has-session -t $SESSION 2>/dev/null
if [ $? != 0 ]; then
  # ==========================================
  # START NEW SESSION
  # ==========================================

  # Pane 1 (Top Left): Docker / Infrastructure
  # We start the session detached (-d) so it doesn't mess up your terminal yet
  tmux new-session -d -s $SESSION -n "DevWorkspace"
  tmux send-keys -t $SESSION "docker-compose up" C-m

  # Pane 2 (Top Right): Backend API
  tmux split-window -h
  tmux send-keys -t $SESSION "pnpm dev:server" C-m

  # Pane 3 (Bottom Left): Mobile App (Expo)
  tmux split-window -v
  tmux send-keys -t $SESSION "pnpm dev:mobile" C-m

  # Pane 4 (Bottom Right): Web Admin
  # We select pane 0 (top left) and split it vertically to create the bottom-left slot
  tmux select-pane -t 0
  tmux split-window -v
  tmux send-keys -t $SESSION "pnpm dev:web" C-m

  # Arrange them in a 2x2 grid
  tmux select-layout -t $SESSION tiled
fi

# ==========================================
# ATTACH TO SESSION
# ==========================================
tmux attach-session -t $SESSION