#!/bin/sh

ln -sf ../../git-hooks/pre-push "$(git rev-parse --show-toplevel)/.git/hooks/"