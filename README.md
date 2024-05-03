# rust-build.action

`Packages & build (soon:tm:) your rust builds for your desired targets (macos, windows (soon), linux (soon).)`

## Usage

Have a look at this configuration:
https://github.com/imyanice/pomodoro-timer/blob/main/.github/workflows/build.yml.
Kinda yonkie but you get the point build.yml:

```yaml
- uses: imyanice/rust-build.action@latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    with:
      tagName: app-v__VERSION__ # The action replaces __VERSION__ with your version.
      releaseName: 'App v__VERSION__'
      targets: 'aarch64-apple-darwin,x86_64-apple-darwin' # the two supported for now
      srcDir: './'
```

## BUT! You also need a Cargo.toml config!

Here is an example:

```
[rust-build.action]
identifier = "me.yanice.pomodoro-timer"
category = "public.app-category.utilities"
copyright = "© 2024 Yanice (imyanice)."
icon = "icons/icon.png"
displayName = "Pomodoro Timer"
```

# License

GPL-v3.0
