#!/bin/sh

for markdown in *.markdown
do
    html=html/`basename $markdown .markdown`.html
    echo $markdown '=>' $html
    node ../doctool/doctool.js template.html $markdown > $html
done
