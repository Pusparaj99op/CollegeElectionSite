#!/bin/bash
echo "Checking domain configuration for anymovie.shop..."
echo "Current nameservers:"
dig NS anymovie.shop +short
echo
echo "Current A records:"
dig A anymovie.shop +short
echo
echo "Current DNS propagation status:"
curl -s https://dns-api.org/NS/anymovie.shop | jq
