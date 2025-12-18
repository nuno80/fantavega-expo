{ pkgs }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.docker
    pkgs.corepack
    pkgs.sudo
  ];

  idx.extensions = [
    "esbenp.prettier-vscode"
    "YoavBls.pretty-ts-errors"
    "dbaeumer.vscode-eslint"
    "formulahendry.auto-rename-tag"
  ];

  services.docker = {
    enable = true; # This line enables Docker
  };

  idx.previews = {
    previews = {
      web = {
        command = [
          "pnpm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
