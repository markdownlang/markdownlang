# main

**Input a palindrome to check:**

> input

[input](#check)

# check

1. word
- reversed = ""
- i = 0
- len = word.length

[word, reversed, i, len](#reverse)

# reverse

1. word
1. reversed
1. i
1. len

## *i >= len*

[word, reversed](#compare)

---

reversed += word[len - 1 - i]

[word, reversed, i + 1, len](#reverse)

# compare

1. original
1. reversed

## *original == reversed*

**{original} is a palindrome!**

---

**{original} is not a palindrome.**
