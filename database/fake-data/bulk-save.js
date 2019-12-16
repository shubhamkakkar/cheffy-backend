const ProgressBar = require('progress');


async function bulkExecute(Model, data) {
  return await Model.bulkCreate(data)
}

function preparation(total) {
  console.time('timeTaken');
  console.log(`Preparing to save ${total} fake data. Please wait for a while.`);
  console.log();
}

module.exports = async function bulkSave({Model, buildModel, total}) {
  const BATCH_SIZE = 1000;
  let bulkData = [];

  preparation(total);

  const progressBar = new ProgressBar('saving [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: total
  });

  for(let counter=0; counter < total; counter++) {
    const doc = await buildModel(counter);
    bulkData.push(doc);
    if ( counter % BATCH_SIZE === 0 ) {
      try {
        await bulkExecute(Model, bulkData);
      } catch(e) {
        console.log('failed bulkExecute', e);
      }
      progressBar.tick(BATCH_SIZE);
      bulk = [];
    }
  }
  return;
}
