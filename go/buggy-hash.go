package main

import (
	"context"
	"fmt"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
	argCount := len(os.Args[1:])
	if (argCount != 1) {
		fmt.Println("usage: ./buggy-hash blockNumber")
		os.Exit(1)
	}

	ctx := context.Background()
	blockNumber, ok := new(big.Int).SetString(os.Args[1], 10)

	if !ok {
		fmt.Println("failed to parse block number")
		os.Exit(2)
	}

	client, _ := ethclient.Dial("https://rpc.gnosischain.com")
	blockHeader, _ := client.HeaderByNumber(ctx, blockNumber)
	fmt.Printf("%x", blockHeader.Hash())
}
