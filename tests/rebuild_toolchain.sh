#!/usr/bin/env bash
# ============================================================
# AV OS — sandbox toolchain rebuild (ephemeral environments)
#
# Ephemeral sandboxes lose /opt, /tmp and running processes between
# sessions while only the workspace persists. Network egress is often
# restricted to github.com (source tarballs), npm and pypi — no distro
# mirrors. This script rebuilds the full runtime from GitHub sources:
#
#   /opt/avtools  m4, bison, autoconf, automake, re2c, pkgconf, cmake*, ninja*, meson*
#   /opt/avlibs   zlib, openssl, libxml2, libpng, freetype, libzip, curl, pcre2,
#                 ncurses, libaio, oniguruma, fmt headers
#   /opt/php      PHP 8.4 CLI (mysqlnd, mbstring, gd, curl, xml, zip, openssl, …)
#   /opt/mariadb  MariaDB 10.11 (mariadbd + clients)
#
#   * cmake/ninja/meson via pip (pypi wheels).
#
# Usage:  bash tests/rebuild_toolchain.sh [stage]
#   stages: downloads autotools libs php mariadb runtime all   (default: all)
# Runtime stage also provisions the database and re-publishes the site.
# ============================================================
set -euo pipefail

# absolute source location (resolved before any cd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STAGE="${1:-all}"
PREFIX=/opt/avtools
AVLIBS=/opt/avlibs
SRC=/tmp/src
LOG=$SRC/logs
mkdir -p "$SRC" "$LOG"
sudo mkdir -p "$PREFIX" "$AVLIBS" /opt/php /opt/mariadb /opt/mariadb-data
sudo chown -R "$(id -u)" "$PREFIX" "$AVLIBS" /opt/php /opt/mariadb /opt/mariadb-data 2>/dev/null || true
export PATH="$PREFIX/bin:$HOME/.local/bin:$PATH"
export PKG_CONFIG_PATH="$AVLIBS/lib/pkgconfig:$AVLIBS/lib64/pkgconfig"
cd "$SRC"

log() { echo "[toolchain] $*"; }

dl() { # dl <owner/repo> <tag> <file>
  [ -s "$3" ] || { log "download $3"; curl -sL --max-time 600 -o "$3" "https://codeload.github.com/$1/tar.gz/refs/tags/$2"; }
}

# ---------------------------------------------------------- downloads
if [[ "$STAGE" == downloads || "$STAGE" == all ]]; then
  dl php/php-src php-8.4.24 php.tar.gz &
  dl MariaDB/server mariadb-10.11.18 mariadb.tar.gz &
  dl openssl/openssl openssl-3.5.7 openssl.tar.gz &
  dl tar-mirror/gnu-m4 v1.4.18 m4.tar.gz &
  dl tar-mirror/gnu-bison v3.0.4 bison.tar.gz &
  dl tar-mirror/gnu-autoconf v2.69 autoconf.tar.gz &
  dl tar-mirror/gnu-automake v1.15 automake.tar.gz &
  dl skvadrik/re2c 4.5 re2c.tar.gz &
  dl madler/zlib v1.3.2 zlib.tar.gz &
  dl PCRE2Project/pcre2 pcre2-10.47 pcre2.tar.gz &
  dl pnggroup/libpng v1.6.47 libpng.tar.gz &
  dl curl/curl curl-8_16_0 curl.tar.gz &
  dl GNOME/libxml2 v2.14.6 libxml2.tar.gz &
  dl freetype/freetype VER-2-13-3 freetype.tar.gz &
  dl nih-at/libzip v1.11.4 libzip.tar.gz &
  dl kkos/oniguruma v6.9.10 onig.tar.gz &
  dl mirror/ncurses v6.4 ncurses.tar.gz &
  dl MariaDB/mariadb-connector-c v3.3.19 connector-c.tar.gz &
  dl fmtlib/fmt 11.0.2 fmt.tar.gz &
  curl -sL --max-time 60 -o libaio.tar.gz "https://codeload.github.com/crossbuild/libaio/tar.gz/refs/heads/master" &
  dl pkgconf/pkgconf pkgconf-2.4.0 pkgconf.tar.gz &
  wait
  log "downloads complete"
fi

# ---------------------------------------------------------- autotools
if [[ "$STAGE" == autotools || "$STAGE" == all ]]; then
  [[ -x $PREFIX/bin/autoconf && -x $PREFIX/bin/bison ]] && log "autotools present" || {
    pip3 install -q --break-system-packages cmake ninja meson || pip3 install -q cmake ninja meson
    tar xzf m4.tar.gz && tar xzf bison.tar.gz && tar xzf autoconf.tar.gz && tar xzf automake.tar.gz
    # glibc >= 2.34 removed legacy _IO_* macros; patch gnulib detection + SIGSTKSZ
    cat > $SRC/glibc_compat.h <<'EOF'
#ifndef _IO_IN_BACKUP
# define _IO_IN_BACKUP 0x100
#endif
EOF
    sed -i 's/#elif HAVE_LIBSIGSEGV && SIGSTKSZ < 16384/#elif 0/' gnu-m4-1.4.18/lib/c-stack.c
    sed -i 's/defined _IO_ftrylockfile || __GNU_LIBRARY__ == 1/defined _IO_ftrylockfile || defined __GLIBC__/g' gnu-m4-1.4.18/lib/*.c gnu-bison-3.0.4/lib/*.c
    python3 - <<'EOF'
s=open('gnu-m4-1.4.18/lib/freadahead.c').read()
s=s.replace('#elif defined __sferror || defined __DragonFly__ || defined __ANDROID__',
'''#elif defined __GLIBC__
  return 1;
#elif defined __sferror || defined __DragonFly__ || defined __ANDROID__''',1)
open('gnu-m4-1.4.18/lib/freadahead.c','w').write(s)
EOF
    (cd gnu-m4-1.4.18 && ./configure --prefix=$PREFIX >$LOG/m4.log 2>&1 && make -j2 CFLAGS="-g -O2 -include $SRC/glibc_compat.h" >>$LOG/m4.log 2>&1 && make install CFLAGS="-include $SRC/glibc_compat.h" >>$LOG/m4.log 2>&1)
    (cd gnu-bison-3.0.4 && ./configure --prefix=$PREFIX M4=$PREFIX/bin/m4 >$LOG/bison.log 2>&1 && make -j2 CFLAGS="-g -O2 -include $SRC/glibc_compat.h" >>$LOG/bison.log 2>&1 && make install CFLAGS="-include $SRC/glibc_compat.h" >>$LOG/bison.log 2>&1)
    (cd gnu-autoconf-2.69 && ./configure --prefix=$PREFIX >$LOG/autoconf.log 2>&1 && make -j2 >>$LOG/autoconf.log 2>&1 && make install >>$LOG/autoconf.log 2>&1)
    (cd gnu-automake-1.15 && ./configure --prefix=$PREFIX >$LOG/automake.log 2>&1 && make -j2 >>$LOG/automake.log 2>&1 && make install >>$LOG/automake.log 2>&1)
    tar xzf re2c.tar.gz
    cmake -S re2c-4.5 -B re2c-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$PREFIX >$LOG/re2c.log 2>&1 && cmake --build re2c-build -j2 >>$LOG/re2c.log 2>&1 && cmake --install re2c-build >>$LOG/re2c.log 2>&1
    tar xzf pkgconf.tar.gz
    meson setup pkgconf-pkgconf-2.4.0/build pkgconf-pkgconf-2.4.0 --prefix=$PREFIX -Dbuildtype=release -Ddefault_library=static >$LOG/pkgconf.log 2>&1 && meson compile -C pkgconf-pkgconf-2.4.0/build >>$LOG/pkgconf.log 2>&1 && meson install -C pkgconf-pkgconf-2.4.0/build >>$LOG/pkgconf.log 2>&1
    ln -sf $PREFIX/bin/pkgconf $PREFIX/bin/pkg-config
    log "autotools ready: $(m4 --version | head -1), $(bison --version | head -1), $(autoconf --version | head -1), $(re2c --version | head -1)"
  }
fi

# ---------------------------------------------------------- libraries
if [[ "$STAGE" == libs || "$STAGE" == all ]]; then
  [[ -f $AVLIBS/lib64/libssl.a ]] && log "libs present" || {
    tar xzf zlib.tar.gz; tar xzf libpng.tar.gz; tar xzf pcre2.tar.gz; tar xzf openssl.tar.gz
    tar xzf libxml2.tar.gz; tar xzf freetype.tar.gz; tar xzf libzip.tar.gz; tar xzf curl.tar.gz
    tar xzf onig.tar.gz; tar xzf ncurses.tar.gz; tar xzf libaio.tar.gz; tar xzf fmt.tar.gz
    (cd zlib-1.3.2 && ./configure --prefix=$AVLIBS --static >$LOG/zlib.log 2>&1 && make -j2 >>$LOG/zlib.log 2>&1 && make install >>$LOG/zlib.log 2>&1)
    (cd libaio-master && make -j2 prefix=$AVLIBS >$LOG/libaio.log 2>&1 && make install prefix=$AVLIBS >>$LOG/libaio.log 2>&1)
    cmake -S libpng-1.6.47 -B png-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DPNG_TESTS=OFF -DPNG_TOOLS=OFF >$LOG/png.log 2>&1 && cmake --build png-build -j2 >>$LOG/png.log 2>&1 && cmake --install png-build >>$LOG/png.log 2>&1
    # pcre2 10.47 vendors sljit as a git submodule (unavailable) — build without JIT
    cmake -S pcre2-pcre2-10.47 -B pcre2-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DPCRE2_BUILD_PCRE2GREP=OFF -DPCRE2_SUPPORT_JIT=OFF -DPCRE2_BUILD_TESTS=OFF >$LOG/pcre2.log 2>&1 && cmake --build pcre2-build -j2 >>$LOG/pcre2.log 2>&1 && cmake --install pcre2-build >>$LOG/pcre2.log 2>&1
    (cd openssl-openssl-3.5.7 && perl ./Configure --prefix=$AVLIBS --openssldir=$AVLIBS/ssl no-shared no-tests no-docs linux-x86_64 -O2 >$LOG/ossl.log 2>&1 && make -j2 >>$LOG/ossl.log 2>&1 && make install_sw install_ssldirs >>$LOG/ossl.log 2>&1)
    cmake -S libxml2-2.14.6 -B xml2-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DLIBXML2_WITH_PYTHON=OFF -DLIBXML2_WITH_ZLIB=ON -DLIBXML2_WITH_ICONV=OFF -DLIBXML2_WITH_LZMA=OFF -DLIBXML2_WITH_TESTS=OFF >$LOG/xml2.log 2>&1 && cmake --build xml2-build -j2 >>$LOG/xml2.log 2>&1 && cmake --install xml2-build >>$LOG/xml2.log 2>&1
    cmake -S freetype-VER-2-13-3 -B ft-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DFT_DISABLE_ZLIB=TRUE -DFT_DISABLE_BZIP2=TRUE -DFT_DISABLE_PNG=TRUE -DFT_DISABLE_HARFBUZZ=TRUE -DFT_DISABLE_BROTLI=TRUE >$LOG/ft.log 2>&1 && cmake --build ft-build -j2 >>$LOG/ft.log 2>&1 && cmake --install ft-build >>$LOG/ft.log 2>&1
    cmake -S libzip-1.11.4 -B zip-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DZLIB_LIBRARY=$AVLIBS/lib/libz.a -DZLIB_INCLUDE_DIR=$AVLIBS/include -DBUILD_TOOLS=OFF -DBUILD_EXAMPLES=OFF -DBUILD_DOC=OFF -DENABLE_BZIP2=OFF -DENABLE_LZMA=OFF -DENABLE_ZSTD=OFF -DENABLE_CRYPTO=OFF >$LOG/zip.log 2>&1 && cmake --build zip-build -j2 >>$LOG/zip.log 2>&1 && cmake --install zip-build >>$LOG/zip.log 2>&1
    cmake -S curl-curl-8_16_0 -B curl-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DBUILD_CURL_EXE=OFF -DBUILD_TESTING=OFF -DCURL_USE_OPENSSL=ON -DOPENSSL_ROOT_DIR=$AVLIBS -DZLIB_LIBRARY=$AVLIBS/lib/libz.a -DZLIB_INCLUDE_DIR=$AVLIBS/include -DCURL_USE_LIBSSH2=OFF -DCURL_USE_LIBPSL=OFF -DUSE_NGHTTP2=OFF -DCURL_USE_IDN2=OFF >$LOG/curl.log 2>&1 && cmake --build curl-build -j2 >>$LOG/curl.log 2>&1 && cmake --install curl-build >>$LOG/curl.log 2>&1
    cmake -S oniguruma-6.9.10 -B onig-build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$AVLIBS -DBUILD_SHARED_LIBS=OFF -DENABLE_POSIX_API=OFF >$LOG/onig.log 2>&1 && cmake --build onig-build -j2 >>$LOG/onig.log 2>&1 && cmake --install onig-build >>$LOG/onig.log 2>&1
    (cd ncurses-6.4 && ./configure --prefix=$AVLIBS --without-debug --without-ada --without-cxx --without-progs --without-tests --enable-overwrite --with-termcap=no >$LOG/ncurses.log 2>&1 && make -j2 >>$LOG/ncurses.log 2>&1 && make install >>$LOG/ncurses.log 2>&1)
    # fmt headers (MariaDB libfmt check is header-only)
    cp -r fmt-11.0.2/include/fmt $AVLIBS/include/
    log "libraries ready in $AVLIBS"
  }
fi

# ---------------------------------------------------------- php
if [[ "$STAGE" == php || "$STAGE" == all ]]; then
  [[ -x /opt/php/bin/php ]] && log "php present" || {
    tar xzf php.tar.gz && cd php-src-php-8.4.24
    ./buildconf --force >$LOG/php-buildconf.log 2>&1
    ./configure --prefix=/opt/php \
      --enable-cli --disable-cgi --disable-phpdbg --without-pear --disable-all \
      --enable-pdo --enable-mysqlnd --with-mysqli=mysqlnd --with-pdo-mysql=mysqlnd \
      --enable-mbstring --enable-fileinfo --enable-filter --enable-tokenizer \
      --enable-ctype --enable-posix --enable-pcntl --enable-session --enable-phar \
      --enable-opcache --enable-sockets \
      --with-zlib=$AVLIBS --with-openssl=$AVLIBS --with-curl=$AVLIBS \
      --with-libxml=$AVLIBS --enable-dom --enable-simplexml --enable-xml --enable-xmlreader --enable-xmlwriter \
      --enable-gd --with-freetype=$AVLIBS \
      --with-zip=$AVLIBS >$LOG/php-conf.log 2>&1
    make -j2 >$LOG/php-make.log 2>&1 && make install >>$LOG/php-make.log 2>&1
    cat > /opt/php/lib/php.ini <<'EOF'
memory_limit = 512M
error_reporting = E_ALL & ~E_DEPRECATED
display_errors = On
log_errors = On
upload_max_filesize = 25M
post_max_size = 25M
max_execution_time = 120
opcache.enable = 1
opcache.enable_cli = 1
opcache.validate_timestamps = 1
opcache.revalidate_freq = 2
zend_extension=opcache.so
EOF
    sudo ln -sf /opt/php/bin/php /usr/local/bin/php
    log "php ready: $(/opt/php/bin/php --version | head -1)"
    cd "$SRC"
  }
fi

# ---------------------------------------------------------- mariadb
if [[ "$STAGE" == mariadb || "$STAGE" == all ]]; then
  [[ -x /opt/mariadb/bin/mariadbd ]] && log "mariadb present" || {
    tar xzf mariadb.tar.gz && tar xzf connector-c.tar.gz
    MDB=$SRC/server-mariadb-10.11.18
    mkdir -p $MDB/libmariadb $MDB/build
    tar xzf connector-c.tar.gz -C $MDB/libmariadb --strip-components=1
    cd $MDB/build
    cmake .. -GNinja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/opt/mariadb \
      -DCMAKE_PREFIX_PATH=$AVLIBS -DCMAKE_INCLUDE_PATH=$AVLIBS/include -DCMAKE_LIBRARY_PATH="$AVLIBS/lib;$AVLIBS/lib64" \
      -DWITH_SSL=system -DWITH_ZLIB=system -DWITH_PCRE=system -DWITH_LIBAIO=system \
      -DWITH_LIBFMT=system -DLIBFMT_INCLUDE_DIR=$AVLIBS/include \
      -DPLUGIN_S3=NO -DPLUGIN_ROCKSDB=NO -DPLUGIN_MROONGA=NO -DPLUGIN_OQGRAPH=NO -DPLUGIN_CONNECT=NO -DPLUGIN_COLUMNSTORE=NO -DPLUGIN_SPIDER=NO -DPLUGIN_SPHINX=NO -DPLUGIN_FEDERATED=NO -DPLUGIN_FEDERATEDX=NO -DPLUGIN_SEQUENCE=NO -DPLUGIN_BLACKHOLE=NO -DPLUGIN_ARCHIVE=NO -DPLUGIN_HASHICORP_KEY_MANAGEMENT=NO \
      -DWITH_WSREP=OFF -DWITH_EMBEDDED_SERVER=OFF -DWITH_UNIT_TESTS=OFF -DWITH_MARIABACKUP=OFF -DWITH_LIBWRAP=OFF \
      >$LOG/mdb-conf.log 2>&1
    # force the term.h probe (curl-style checks run before ncurses is discovered)
    sed -i 's/^HAVE_TERM_H:INTERNAL=$/HAVE_TERM_H:INTERNAL=1/' CMakeCache.txt || true
    cmake .. -GNinja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/opt/mariadb \
      -DCMAKE_PREFIX_PATH=$AVLIBS -DCMAKE_INCLUDE_PATH=$AVLIBS/include -DCMAKE_LIBRARY_PATH="$AVLIBS/lib;$AVLIBS/lib64" \
      -DWITH_SSL=system -DWITH_ZLIB=system -DWITH_PCRE=system -DWITH_LIBAIO=system \
      -DWITH_LIBFMT=system -DLIBFMT_INCLUDE_DIR=$AVLIBS/include \
      -DPLUGIN_S3=NO -DPLUGIN_ROCKSDB=NO -DPLUGIN_MROONGA=NO -DPLUGIN_OQGRAPH=NO -DPLUGIN_CONNECT=NO -DPLUGIN_COLUMNSTORE=NO -DPLUGIN_SPIDER=NO -DPLUGIN_SPHINX=NO -DPLUGIN_FEDERATED=NO -DPLUGIN_FEDERATEDX=NO -DPLUGIN_SEQUENCE=NO -DPLUGIN_BLACKHOLE=NO -DPLUGIN_ARCHIVE=NO -DPLUGIN_HASHICORP_KEY_MANAGEMENT=NO \
      -DWITH_WSREP=OFF -DWITH_EMBEDDED_SERVER=OFF -DWITH_UNIT_TESTS=OFF -DWITH_MARIABACKUP=OFF -DWITH_LIBWRAP=OFF \
      >>$LOG/mdb-conf.log 2>&1
    # static pcre archive where the linker searches (the final link resolves -lpcre2-8)
    sudo cp $AVLIBS/lib/libpcre2-8.a /usr/lib/x86_64-linux-gnu/libpcre2-8.a 2>/dev/null || true
    sudo cp $AVLIBS/lib/libpcre2-posix.a /usr/lib/x86_64-linux-gnu/libpcre2-posix.a 2>/dev/null || true
    ninja -j2 mariadbd mariadb mariadb-admin >$LOG/mdb-build.log 2>&1
    ninja -j2 install >$LOG/mdb-install.log 2>&1
    echo "$AVLIBS/lib" | sudo tee /etc/ld.so.conf.d/avlibs.conf >/dev/null && sudo ldconfig
    log "mariadb ready: $(/opt/mariadb/bin/mariadbd --version)"
    cd "$SRC"
  }
fi

# ---------------------------------------------------------- runtime
if [[ "$STAGE" == runtime || "$STAGE" == all ]]; then
  REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
  export PATH="/opt/php/bin:/opt/mariadb/bin:/opt/mariadb/scripts:$PATH"
  # local dev config (gitignored — does not survive sandbox resets)
  if [ ! -f "$REPO/avos-php/config.local.php" ]; then
    ENCKEY=$(php -r "echo bin2hex(random_bytes(32));")
    cat > "$REPO/avos-php/config.local.php" <<EOF
<?php
\$env = 'development';
define('AV_ENV', \$env);
define('AV_DEBUG', true);
\$db = ['host' => '127.0.0.1', 'name' => 'avos', 'user' => 'avos', 'pass' => 'aV0s_d3v_9xKq2mN7', 'charset' => 'utf8mb4'];
\$encKey = '$ENCKEY';
\$sessionHours = 12;
\$siteUrl = 'https://abhijeetvarghese.com';
EOF
    chmod 600 "$REPO/avos-php/config.local.php"
    log "config.local.php recreated (development)"
  fi
  # database
  if [ ! -d /opt/mariadb-data/mysql ]; then
    mariadb-install-db --basedir=/opt/mariadb --datadir=/opt/mariadb-data --user="$(whoami)" --auth-root-authentication-method=normal --skip-test-db >$LOG/mdb-initdb.log 2>&1
    log "database initialised"
  fi
  if ! mariadb-admin --host=127.0.0.1 -u root ping >/dev/null 2>&1; then
    nohup /opt/mariadb/bin/mariadbd --datadir=/opt/mariadb-data --socket=/tmp/mariadb.sock \
      --port=3306 --bind-address=127.0.0.1 --skip-name-resolve >$LOG/mariadbd-runtime.log 2>&1 &
    for i in $(seq 1 30); do mariadb-admin --host=127.0.0.1 -u root ping >/dev/null 2>&1 && break; sleep 1; done
    log "mariadbd started"
  fi
  mariadb -h 127.0.0.1 -u root < "$REPO/avos-php/database/provision.sql"
  php "$REPO/avos-php/database/migrate.php" | tail -1
  php "$REPO/avos-php/backend/scripts/restore-canonical.php" | tail -1
  # admin account (installer refuses once migrations are recorded — create directly)
  cat > "$SRC/ensure_admin.php" <<'PHPEOF'
<?php
$root = $argv[1];
require $root . '/backend/config/config.php';
$db = AV_DB;
$pdo = new PDO("mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4", $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ((int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {
  $pass = bin2hex(random_bytes(12));
  $st = $pdo->prepare("INSERT INTO users (name, email, password_hash, role_id, status, must_change_password) VALUES (?,?,?,1,'active',1)");
  $st->execute(['Abhijeet Varghese', 'admin@abhijeetvarghese.com', password_hash($pass, PASSWORD_DEFAULT)]);
  echo "ADMIN CREATED admin@abhijeetvarghese.com / $pass\n";
} else {
  echo "admin exists\n";
}
file_put_contents($root . '/public_html/install/.installed', date('c'));
PHPEOF
  php "$SRC/ensure_admin.php" "$REPO/avos-php"
  php "$REPO/avos-php/backend/scripts/auto-publish.php" | tail -1
  php "$REPO/avos-php/backend/scripts/doctor.php" | tail -1
  log "runtime ready — start servers with:"
  log "  mariadbd --datadir=/opt/mariadb-data --socket=/tmp/mariadb.sock --port=3306 --bind-address=127.0.0.1 --skip-name-resolve"
  log "  (cd $REPO/avos-php && php -S 0.0.0.0:8092 router.php)"
fi

log "stage '$STAGE' complete"
