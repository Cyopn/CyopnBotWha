{ pkgs }: {
    deps = [
        pkgs.yarn
        pkgs.esbuild
        pkgs.nodejs-18_x
        pkgs.ffmpeg
        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}