
import * as moment from 'moment';
import * as request from 'request';
import * as builder from 'xmlbuilder';
import * as crypto from 'crypto';
import * as _extend from 'lodash/extend';
import * as _merge from 'lodash/merge';
import * as path from 'path';
import * as parser from 'xml2js';
import { logger } from './utils/logger';

export default class DHLAPI {
  private environment: string = this.params.environment;
  private debug: boolean = this.params.debug;
  private url: string = this.environment === 'production' ? 'https://xmlpi-ea.dhl.com/XMLShippingServlet' : 'https://xmlpitest-ea.dhl.com/XMLShippingServlet';
  private account: string = this.params.account;
  private siteID: string = this.params.siteID;
  private password: string = this.params.password;
  private softwareName: string = this.params.softwareName;
  private softwareVersion: string = this.params.softwareVersion;

  constructor(
    private params: any
  ) { }

  public createPickup(params: any, cb: any) {

    params = _merge(this.getRequestHeader(), params);

    const xml = builder.create({
      [`req:BookPURequest`]: params
    })
      .att('xmlns:req', 'http://www.dhl.com')
      .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .att('xmlns:schemaLocation', `http://www.dhl.com book-pickup-global-req.xsd`)
      .att('schemaVersion', `3.0`)
      .end({ pretty: true });

    this.request(xml, (err, res) => {
      return cb(err, res);
    });

  }

  public deletePickup(params: any, cb: any) {

    params = _merge(this.getRequestHeader(), params);

    const xml = builder.create({
      [`req:CancelPURequest`]: params
    })
      .att('xmlns:req', 'http://www.dhl.com')
      .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .att('xmlns:schemaLocation', `http://www.dhl.com cancel-pickup-global-req.xsd`)
      .att('schemaVersion', `3.0`)
      .end({ pretty: true });

    this.request(xml, (err, res) => {
      return cb(err, res);
    });

  }

  public createShipment(params: any, cb: any) {

    params = _merge(this.getRequestHeader(), params.ShipmentRequest);

    let xml = builder.create({
      [`req:ShipmentRequest`]: params
    })
      .att('xmlns:req', 'http://www.dhl.com')
      .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .att('xsi:schemaLocation', `http://www.dhl.com ship-val-global-req.xsd`)
      .att('schemaVersion', `10.0`)
      .end({ pretty: true });

    xml = xml.replace(`<?xml version="1.0"?>\n`, '')
    console.log('XML:', typeof xml, xml);

    this.request(xml, (err, res) => {
      return cb(err, res);
    });

  }

  public getServices(params: any, cb: any) {

    if(params.GetCapability) params.GetCapability = _merge(this.getRequestHeader(), params.GetCapability);
    if(params.GetQuote) params.GetQuote = _merge(this.getRequestHeader(), params.GetQuote);

    const xml = builder.create({
      [`p:DCTRequest`]: params
    })
      .att('xmlns:p', 'http://www.dhl.com')
      .att('xmlns:p1', 'http://www.dhl.com/datatypes')
      .att('xmlns:p2', 'http://www.dhl.com/DCTRequestdatatypes')
      .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .att('xmlns:schemaLocation', `http://www.dhl.com DCT-req.xsd`)
      .end({ pretty: true });

    this.request(xml, (err, res) => {
      return cb(err, res);
    });

  }

  public getTracking(params: any, cb: any) {

    params = _extend(this.getRequestHeader(), params);

    const xml = builder.create({
      [`req:KnownTrackingRequest`]: params
    })
      .att('xmlns:req', 'http://www.dhl.com')
      .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .att('xmlns:schemaLocation', `http://www.dhl.com TrackingRequestKnown.xsd`)
      .end({ pretty: true });

    this.request(xml, (err, res) => {
      return cb(err, res);
    });

  }

  private request(xml: any, cb) {
    request.post({
      url: this.url,
      body: xml,
      headers: {
        'Content-Type': 'text/xml'
      }
    }, (err, res, body) => {

      if (this.debug && err) {

        parser.parseString(err, { explicitArray: false }, (err, res) => {
          logger.error(`Request error`, err);
          return cb(err);
        });

      }

      parser.parseString(body, { explicitArray: false }, (err, res) => {
        logger.log(`Request done`, err);
        return cb(err, res);
      });


    });

  }

  private getRequestHeader() {

    return {
      Request: {
        ServiceHeader: {
          MessageTime: moment().format(),
          MessageReference: crypto.randomBytes(16).toString('hex'),
          SiteID: this.siteID,
          Password: this.password
        },
        MetaData: {
          SoftwareName: this.softwareName,
          SoftwareVersion: this.softwareVersion,
        }
      }
    };

  }

}
