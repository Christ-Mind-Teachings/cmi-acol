#
# if we find the regex then we keep the one line paragraph
# - indicated this by returning 0
#
# return 1 if we want to discard the paragraph
#
function discardParagraph(p) {
  return 0
}

function bookId(book) {
  return 5
}

function unitId(unit) {
  switch(unit) {
    case "chap01":
      uid = 1
      break
    case "chap02":
      uid = 2
      break
    case "chap03":
      uid = 3
      break
    case "chap04":
      uid = 4
      break
  }

  return uid
}

BEGIN {
  i = 0
  p = 0
  l = -1
  fm = 0
  omit = 0
  inp = false
  needComma = "n"

  if (debug == 0) {
    printf "{\n  \"source\": \"%s\",\n  \"book\": \"%s\",\n  \"unit\": \"%s\",\n", source, book, unit
    printf "  \"paragraph\": [\n"
  }
}
/---/ {
  if (fm == 0) {
    fm = 1
  }
  else if (fm == 1) {
    fm = 2
  }
  next
}
# an image
/^!\[/ {
  next
}
# a markdown class designation
/^{:/ {
  omit = 1
  next
}
# opening or closing div
/^<div/ || /^<\/div/ {
  next
}
/^$/ || /^>$/ || /^>\s*$/ {
  if (debug == 1) {
    for (line in lines) {
      text = sprintf("%s %s", text, lines[line])
    }
    printf "%s\n\n", tolower(text)
    l = -1
    text = ""
    delete lines
    p++
    next
  }

  # discard paragraphs when omit is true
  if (omit == 1) {
    l = -1
    text = ""
    delete lines
    p++
    omit = 0
    next
  }

  if (l > -1) {
    len = length(lines)
    discard = 0
    if (len == 1) {
      discard = discardParagraph(lines[0])
    }
    printf "  %s{\n", needComma == "y" ? "," : ""
    printf "    \"discard\": %u,\n", discard
    printf "    \"pid\": %s,\n", p
    for (line in lines) {
      raw = lines[line]
      # remove <br/> 
      gsub(/<br\/>/,"",raw)
      # remove <p></p> 
      gsub(/<\/?p[^>]*>/,"",raw)
      # remove <span></span> 
      gsub(/<\/?span[^>]*>/,"",raw)
      # remove punctuation
      gsub(/[\[\])(*>.,!?;:–‘’'"“”/\\]/,"",raw)
      #remove 0xa0
      gsub(/ /,"",raw)
      # convert dash to space 
      gsub(/[-—]/," ",raw)
      # remove footnotes: [^1]
      gsub(/\^[[:digit:]]/, "", raw)
      text = sprintf("%s %s", text, raw)
    }
    # remove leading space
    gsub(/^ */, "", text)
    # collapse two spaces into one
    gsub(/  */," ",text)
    # remove underscores - text bracketed by __xxx__ are bolded by markdown
    gsub(/__/,"",text)
    printf "    \"text\": \"%s\"\n  }\n", tolower(text)
    l = -1
    text = ""
    delete lines
    needComma = "y"
    p++
  }
  next
}
{
  # only interested in lines after front matter (fm) removed
  # - that's when fm=2
  if (fm == 2) {
    l++
    lines[l] = $0
  }
}
END {
  if (debug == 0) {
    printf "]}\n"
  }
}

