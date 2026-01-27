{ pkgs }: {
  deps = [
    pkgs.pixman
    pkgs.pkg-config
    pkgs.librsvg
    pkgs.giflib
    pkgs.libjpeg_turbo
    pkgs.cairo
    pkgs.pango
    pkgs.xorg.libXScrnSaver
    pkgs.xorg.libXtst
    pkgs.xorg.libXrandr
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXcursor
    pkgs.xorg.libXinerama
    pkgs.xorg.libXrender
    pkgs.xorg.libXext
    pkgs.xorg.libX11
    pkgs.libuuid
    pkgs.bashInteractive
    pkgs.nodePackages.bash-language-server
    pkgs.man
  ];
}