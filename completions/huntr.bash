#!/usr/bin/env bash

_huntr_completions() {
  local cur prev words cword
  _init_completion || return

  local commands="me boards jobs activities config"
  local global_opts="-t --token -h --help -V --version"
  local format_opts="-f --format json table csv pdf excel"
  local list_opts="-f --format --fields -d --days --types -w --week"
  local config_cmds="capture-session test-session check-cdp set-token show-token clear-token clear-session"

  # Handle first level command
  if [[ $cword -eq 1 ]]; then
    COMPREPLY=($(compgen -W "$commands $global_opts" -- "$cur"))
    return 0
  fi

  # Handle subcommands
  case ${words[1]} in
    me)
      COMPREPLY=($(compgen -W "$global_opts -f --format" -- "$cur"))
      ;;
    boards)
      if [[ $cword -eq 2 ]]; then
        COMPREPLY=($(compgen -W "list get" -- "$cur"))
      elif [[ $cword -gt 2 ]]; then
        case ${words[2]} in
          list)
            COMPREPLY=($(compgen -W "$format_opts $global_opts" -- "$cur"))
            ;;
          get)
            COMPREPLY=($(compgen -W "$format_opts $global_opts" -- "$cur"))
            ;;
        esac
      fi
      ;;
    jobs)
      if [[ $cword -eq 2 ]]; then
        COMPREPLY=($(compgen -W "list get" -- "$cur"))
      elif [[ $cword -gt 2 ]]; then
        case ${words[2]} in
          list)
            COMPREPLY=($(compgen -W "$format_opts $global_opts" -- "$cur"))
            ;;
          get)
            COMPREPLY=($(compgen -W "$format_opts $global_opts" -- "$cur"))
            ;;
        esac
      fi
      ;;
    activities)
      if [[ $cword -eq 2 ]]; then
        COMPREPLY=($(compgen -W "list week-csv" -- "$cur"))
      elif [[ $cword -gt 2 ]]; then
        case ${words[2]} in
          list)
            COMPREPLY=($(compgen -W "$format_opts $global_opts -d --days -w --week --types" -- "$cur"))
            ;;
          week-csv)
            COMPREPLY=($(compgen -W "$global_opts" -- "$cur"))
            ;;
        esac
      fi
      ;;
    config)
      if [[ $cword -eq 2 ]]; then
        COMPREPLY=($(compgen -W "$config_cmds" -- "$cur"))
      elif [[ $cword -gt 2 ]]; then
        case ${words[2]} in
          capture-session|test-session|check-cdp|show-token)
            # No additional options
            ;;
          set-token)
            COMPREPLY=($(compgen -W "$global_opts" -- "$cur"))
            ;;
          clear-token)
            COMPREPLY=($(compgen -W "--all" -- "$cur"))
            ;;
          clear-session)
            # No additional options
            ;;
        esac
      fi
      ;;
  esac

  return 0
}

complete -F _huntr_completions huntr
