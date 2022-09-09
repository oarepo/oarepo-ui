#!/bin/bash

set -e

copy_spec() {
  specs_file=$1
  directory=$2
  module_name=$3

  # copy the file to the target dir
  cp ${specs_file}.py $directory/$module_name

  # get all classes defined in the spec file
  python_f=$(mktemp /tmp/XXXXXXXX).py
  out_f=$(mktemp /tmp/XXXXXXXX).out
  cat $specs_file.py >$python_f

  cat <<EOF >>$python_f
with open("$out_f", "w") as f:
    import inspect
    for k in dir():
        v = locals()[k]
        if inspect.isclass(v) and hasattr(v, "name"):
            print(f"{v.name} = $module_name.$specs_file:{k}", file=f)
EOF
  python $python_f
  cat $out_f | while read LINE; do
    ( cat $directory/setup.cfg | grep "$LINE" &>/dev/null ) || (
      echo "Replacing oarepo_ui inside $directory/setup.cfg with $LINE"
      
      cat $directory/setup.cfg | egrep '^[ \t]*oarepo.ui =[ \t]*$' || (
        sed 's/\(^\[options.entry_points\][ \t]*$\)/\1\noarepo.ui =/' $directory/setup.cfg >$directory/setup.cfg.tmp
        mv $directory/setup.cfg.tmp $directory/setup.cfg
      )
      sed "s/\\(^[ \\t]*oarepo.ui =[ \\t]*$\\)/\1\n    $LINE/" $directory/setup.cfg >$directory/setup.cfg.tmp
      mv $directory/setup.cfg.tmp $directory/setup.cfg
    )
  done
  rm ${python_f} ${out_f}
}

cd "$(dirname $0)"

# copy the ui_components_specs and register to entry points
copy_spec ui_components_specs \
          oarepo-ui \
          oarepo_ui
copy_spec ui_components_specs \
          oarepo-ui-model-builder \
          oarepo_ui_model_builder

test -d dist && rm -rf dist

mkdir dist

for distro in oarepo-ui oarepo-ui-model-builder ; do
  (
    echo "Building $distro"
    cd $distro
    test -d dist && rm -rf dist
    cp ../README.md .
    cat setup.cfg
    python setup.py sdist bdist_wheel
    cp dist/*.tar.gz  ../dist/
    cp dist/*.whl  ../dist/
  )
done

# just list created stuff
ls -la dist

for i in dist/*.tar.gz; do
  echo
  echo Listing $i
  tar -tf $i
done

