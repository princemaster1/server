with import <nixpkgs> {};

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.lsof;
  ];

  shellHook = ''
    ${pkgs.lsof}/bin/lsof -i :3000
    node index.js
  '';
}
