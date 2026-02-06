markdownlang takes a markdown file input and treats it as a script, running the content inside.

Key concepts include:

- headings as scope / implicit function names
- italics → conditionals
- bold → print to console
- links → function calling via filename + heading link, link content passes parameter values
- unordered lists → define variables
- horizontal rules → break statements

For an example, this is fizzbuzz:

```
# fizzbuzz
- i
- text

## *i % 3 == 0*
text += "fizz"

## *i % 5 == 0*
text += "buzz"

## *text != ""*
**{text}**

## *text == ""*
**{i}**

## *i == 100*
---

[i, ""](#fizzbuzz)

---

[0, ""](#fizzbuzz)
```
