"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./aa.init");
const ethers_1 = require("ethers");
const testutils_1 = require("./testutils");
const chai_1 = require("chai");
const utils_1 = require("ethers/lib/utils");
const typechain_1 = require("../typechain");
const hardhat_1 = require("hardhat");
const provider = hardhat_1.ethers.provider;
const ethersSigner = provider.getSigner();
describe('#ValidationData helpers', function () {
    function pack(addr, validUntil, validAfter) {
        return ethers_1.BigNumber.from(ethers_1.BigNumber.from(addr))
            .add(ethers_1.BigNumber.from(validUntil).mul(ethers_1.BigNumber.from(2).pow(160)))
            .add(ethers_1.BigNumber.from(validAfter).mul(ethers_1.BigNumber.from(2).pow(160 + 48)));
    }
    let helpers;
    const addr1 = testutils_1.AddressZero.replace(/0$/, '1');
    const addr = '0x'.padEnd(42, '9');
    const max48 = 2 ** 48 - 1;
    before(async () => {
        helpers = await new typechain_1.TestHelpers__factory(ethersSigner).deploy();
    });
    it('#parseValidationData', async () => {
        (0, chai_1.expect)(await helpers.parseValidationData(0))
            .to.eql({ aggregator: testutils_1.AddressZero, validAfter: 0, validUntil: max48 });
        (0, chai_1.expect)(await helpers.parseValidationData(1))
            .to.eql({ aggregator: addr1, validAfter: 0, validUntil: max48 });
        (0, chai_1.expect)(await helpers.parseValidationData(pack(testutils_1.AddressZero, 0, 10)))
            .to.eql({ aggregator: testutils_1.AddressZero, validAfter: 10, validUntil: max48 });
        (0, chai_1.expect)(await helpers.parseValidationData(pack(testutils_1.AddressZero, 10, 0)))
            .to.eql({ aggregator: testutils_1.AddressZero, validAfter: 0, validUntil: 10 });
    });
    it('#packValidationData', async () => {
        (0, chai_1.expect)(await helpers.packValidationData(false, 0, 0)).to.eql(0);
        (0, chai_1.expect)(await helpers.packValidationData(true, 0, 0)).to.eql(1);
        (0, chai_1.expect)((0, utils_1.hexlify)(await helpers.packValidationData(true, 123, 456)))
            .to.eql((0, utils_1.hexlify)(pack(addr1, 123, 456)));
    });
    it('#packValidationData with aggregator', async () => {
        (0, chai_1.expect)((0, utils_1.hexlify)(await helpers.packValidationDataStruct({ aggregator: addr, validUntil: 234, validAfter: 567 })))
            .to.eql((0, utils_1.hexlify)(pack(addr, 234, 567)));
    });
    it('#intersectTimeRange', async () => {
        (0, chai_1.expect)(await helpers.intersectTimeRange(pack(testutils_1.AddressZero, 0, 0), pack(testutils_1.AddressZero, 0, 0)))
            .to.eql({ aggregator: testutils_1.AddressZero, validAfter: 0, validUntil: max48 });
        (0, chai_1.expect)(await helpers.intersectTimeRange(pack(testutils_1.AddressZero, 100, 10), pack(testutils_1.AddressZero, 200, 50)))
            .to.eql({ aggregator: testutils_1.AddressZero, validAfter: 50, validUntil: 100 });
        (0, chai_1.expect)(await helpers.intersectTimeRange(pack(addr, 100, 10), pack(testutils_1.AddressZero, 200, 50)))
            .to.eql({ aggregator: addr, validAfter: 50, validUntil: 100 });
        (0, chai_1.expect)(await helpers.intersectTimeRange(pack(addr, 100, 10), pack(addr1, 200, 50)))
            .to.eql({ aggregator: addr, validAfter: 50, validUntil: 100 });
        (0, chai_1.expect)(await helpers.intersectTimeRange(pack(testutils_1.AddressZero, 100, 10), pack(addr1, 200, 50)))
            .to.eql({ aggregator: addr1, validAfter: 50, validUntil: 100 });
    });
});
