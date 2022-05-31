package util

import (
	"crypto/md5"
	"encoding/hex"
)

func MD5EnCode(str string) string {
	h := md5.New()
	h.Write([]byte(str))
	cipherStr := h.Sum(nil)
	return hex.EncodeToString(cipherStr)
}

func MD5EnCry(str, salt string )string {
	return MD5EnCode(str+salt)
}

func MD5Cmp(str string,strEncode string,salt string) bool {
	return strEncode == MD5EnCode(str+salt)
}